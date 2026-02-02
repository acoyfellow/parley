import type { ToolType, ToolCall, AgentResponse } from '../types';

/**
 * Tool patterns for parsing agent responses
 */
const TOOL_PATTERNS: Record<ToolType, RegExp> = {
  think: /<think>([\s\S]*?)<\/think>/,
  propose_plan: /<propose_plan>([\s\S]*?)<\/propose_plan>/,
  critique: /<critique>([\s\S]*?)<\/critique>/,
  ask_question: /<ask_question>([\s\S]*?)<\/ask_question>/,
  agree: /<agree>([\s\S]*?)<\/agree>/,
  respond: /<respond>([\s\S]*?)<\/respond>/
};

/**
 * Parse an agent's response to extract thinking and tool calls
 */
export function parseAgentResponse(content: string): AgentResponse {
  let thinking: string | undefined;
  let toolCall: ToolCall | undefined;

  // Extract thinking first
  const thinkMatch = content.match(TOOL_PATTERNS.think);
  if (thinkMatch) {
    thinking = thinkMatch[1].trim();
  }

  // Find the action tool (everything except think)
  const actionTools: ToolType[] = ['propose_plan', 'critique', 'ask_question', 'agree', 'respond'];

  for (const tool of actionTools) {
    const match = content.match(TOOL_PATTERNS[tool]);
    if (match) {
      toolCall = {
        type: tool,
        content: match[1].trim()
      };
      break;
    }
  }

  // If no tool found, treat the whole content as a response
  if (!toolCall) {
    // Remove thinking if present and use the rest
    const contentWithoutThinking = content.replace(TOOL_PATTERNS.think, '').trim();
    toolCall = {
      type: 'respond',
      content: contentWithoutThinking || content
    };
  }

  return {
    thinking,
    toolCall,
    rawContent: content
  };
}

/**
 * Check if the response indicates agreement
 */
export function isAgreement(response: AgentResponse): boolean {
  return response.toolCall.type === 'agree';
}

/**
 * Extract the current plan from conversation history
 */
export function extractCurrentPlan(
  messages: Array<{ content: string }>
): string | null {
  // Find the most recent propose_plan
  for (let i = messages.length - 1; i >= 0; i--) {
    const match = messages[i].content.match(TOOL_PATTERNS.propose_plan);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Format an agent's response for display
 */
export function formatResponseForDisplay(response: AgentResponse): string {
  const parts: string[] = [];

  if (response.thinking) {
    parts.push(`**Thinking:**\n${response.thinking}`);
  }

  const toolLabels: Record<ToolType, string> = {
    think: 'Thinking',
    propose_plan: 'Proposed Plan',
    critique: 'Critique',
    ask_question: 'Question',
    agree: 'Agreement',
    respond: 'Response'
  };

  if (response.toolCall.type !== 'think') {
    parts.push(`**${toolLabels[response.toolCall.type]}:**\n${response.toolCall.content}`);
  }

  return parts.join('\n\n');
}
