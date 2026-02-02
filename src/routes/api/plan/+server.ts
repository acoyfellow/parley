import type { RequestHandler } from './$types';
import { createChatCompletion } from '$lib/server/openrouter';
import { buildConversationMessages } from '$lib/server/prompts';
import { parseAgentResponse, isAgreement, extractCurrentPlan } from '$lib/server/parser';
import type { SSEEvent } from '$lib/types';

const MAX_ROUNDS = 20;

interface PlanRequest {
  prompt: string;
  modelA: string;
  modelB: string;
  history?: Array<{ role: 'agent-a' | 'agent-b' | 'human'; content: string }>;
  humanInput?: string;
}

function sendSSE(controller: ReadableStreamDefaultController, event: SSEEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const apiKey = platform?.env?.OPENROUTER_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { prompt, modelA, modelB, history = [], humanInput } = await request.json() as PlanRequest;

  if (!prompt || !modelA || !modelB) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let conversationHistory: Array<{ role: 'agent-a' | 'agent-b' | 'human'; content: string }> = [...history];
        let agentAAgreed = false;
        let agentBAgreed = false;
        let rounds = history.length > 0 ? Math.floor(history.length / 2) : 0;

        // If human input is provided, add it to history
        if (humanInput) {
          conversationHistory.push({ role: 'human', content: humanInput });
          sendSSE(controller, {
            type: 'message',
            data: {
              role: 'human',
              content: humanInput,
              messageId: `human-${Date.now()}`
            }
          });
          // Reset agreement flags after human intervention
          agentAAgreed = false;
          agentBAgreed = false;
        }

        // Determine whose turn it is
        const lastMessage = conversationHistory[conversationHistory.length - 1];
        let currentAgent: 'agent-a' | 'agent-b' = 'agent-a';

        if (lastMessage) {
          if (lastMessage.role === 'agent-a') {
            currentAgent = 'agent-b';
          } else if (lastMessage.role === 'agent-b') {
            currentAgent = 'agent-a';
          } else if (lastMessage.role === 'human') {
            // After human intervention, let Agent A respond first
            currentAgent = 'agent-a';
          }
        }

        // Planning loop
        while (!agentAAgreed || !agentBAgreed) {
          if (rounds >= MAX_ROUNDS) {
            sendSSE(controller, {
              type: 'error',
              data: { error: 'Maximum rounds reached without agreement' }
            });
            break;
          }

          const model = currentAgent === 'agent-a' ? modelA : modelB;
          const messages = buildConversationMessages(prompt, conversationHistory, currentAgent);
          const messageId = `${currentAgent}-${Date.now()}`;

          // Signal that agent is thinking
          sendSSE(controller, {
            type: 'thinking',
            data: { role: currentAgent, messageId }
          });

          // Stream the response
          let fullResponse = '';
          await createChatCompletion(apiKey, model, messages, (chunk) => {
            fullResponse += chunk;
            sendSSE(controller, {
              type: 'message',
              data: {
                role: currentAgent,
                content: chunk,
                messageId
              }
            });
          });

          // Parse the response
          const parsed = parseAgentResponse(fullResponse);

          // Add to conversation history
          conversationHistory.push({ role: currentAgent, content: fullResponse });

          // Send tool event
          sendSSE(controller, {
            type: 'tool',
            data: {
              role: currentAgent,
              tool: parsed.toolCall.type,
              messageId
            }
          });

          // Check for agreement
          if (isAgreement(parsed)) {
            if (currentAgent === 'agent-a') {
              agentAAgreed = true;
            } else {
              agentBAgreed = true;
            }

            // Check if both agreed
            if (agentAAgreed && agentBAgreed) {
              const finalPlan = extractCurrentPlan(conversationHistory);
              sendSSE(controller, {
                type: 'agreed',
                data: {
                  plan: finalPlan || 'Plan agreed upon.',
                  rounds
                }
              });
              break;
            }
          } else {
            // If one agent makes a non-agreement move, reset the other's agreement
            if (currentAgent === 'agent-a') {
              agentBAgreed = false;
            } else {
              agentAAgreed = false;
            }
          }

          // Switch turns
          currentAgent = currentAgent === 'agent-a' ? 'agent-b' : 'agent-a';

          // Increment rounds after both agents have spoken
          if (currentAgent === 'agent-a') {
            rounds++;
            sendSSE(controller, {
              type: 'message',
              data: { rounds }
            });
          }

          // Small delay between turns for readability
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        controller.close();
      } catch (error) {
        console.error('Planning error:', error);
        sendSSE(controller, {
          type: 'error',
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
};
