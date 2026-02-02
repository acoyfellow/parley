import type { PlanningState, PlanningMessage, PlanningConfig, MessageRole, ToolType, SSEEvent } from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Create a reactive planning store
 */
export function createPlanningStore() {
  let state = $state<PlanningState>({
    status: 'idle',
    prompt: '',
    modelA: null,
    modelB: null,
    messages: [],
    currentPlan: null,
    agentAAgreed: false,
    agentBAgreed: false,
    rounds: 0
  });

  let abortController: AbortController | null = null;
  let currentStreamingMessage: PlanningMessage | null = null;

  function reset() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    state = {
      status: 'idle',
      prompt: '',
      modelA: null,
      modelB: null,
      messages: [],
      currentPlan: null,
      agentAAgreed: false,
      agentBAgreed: false,
      rounds: 0
    };
    currentStreamingMessage = null;
  }

  function configure(config: Partial<PlanningConfig>) {
    state.status = 'configuring';
    if (config.prompt !== undefined) state.prompt = config.prompt;
    if (config.modelA !== undefined) state.modelA = config.modelA;
    if (config.modelB !== undefined) state.modelB = config.modelB;
  }

  async function start() {
    if (!state.prompt || !state.modelA || !state.modelB) {
      state.error = 'Please configure prompt and models first';
      return;
    }

    state.status = 'planning';
    state.error = undefined;
    abortController = new AbortController();

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.prompt,
          modelA: state.modelA,
          modelB: state.modelB,
          history: state.messages.map(m => ({ role: m.role, content: m.content }))
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error('Failed to start planning');
      }

      await processStream(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        state.status = 'stopped';
      } else {
        state.status = 'error';
        state.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  async function intervene(humanInput: string) {
    if (state.status !== 'planning' && state.status !== 'stopped') {
      state.error = 'Cannot intervene at this time';
      return;
    }

    state.status = 'planning';
    state.error = undefined;
    abortController = new AbortController();

    // Add human message immediately for UI feedback
    const humanMessage: PlanningMessage = {
      id: generateId(),
      role: 'human',
      content: humanInput,
      timestamp: Date.now()
    };
    state.messages = [...state.messages, humanMessage];

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.prompt,
          modelA: state.modelA,
          modelB: state.modelB,
          history: state.messages.map(m => ({ role: m.role, content: m.content })),
          humanInput
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error('Failed to send intervention');
      }

      await processStream(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        state.status = 'stopped';
      } else {
        state.status = 'error';
        state.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  async function processStream(response: Response) {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event: SSEEvent = JSON.parse(line.slice(6));
            handleSSEEvent(event);
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  function handleSSEEvent(event: SSEEvent) {
    switch (event.type) {
      case 'thinking': {
        // Start a new streaming message
        const newMessage: PlanningMessage = {
          id: event.data.messageId || generateId(),
          role: event.data.role as MessageRole,
          content: '',
          timestamp: Date.now(),
          isStreaming: true
        };
        currentStreamingMessage = newMessage;
        state.messages = [...state.messages, newMessage];
        break;
      }

      case 'message': {
        if (event.data.rounds !== undefined) {
          state.rounds = event.data.rounds;
        } else if (event.data.content && currentStreamingMessage) {
          // Append to current streaming message
          currentStreamingMessage.content += event.data.content;
          // Trigger reactivity by reassigning
          state.messages = [...state.messages];
        }
        break;
      }

      case 'tool': {
        if (currentStreamingMessage) {
          currentStreamingMessage.tool = event.data.tool as ToolType;
          currentStreamingMessage.isStreaming = false;
          currentStreamingMessage = null;
          state.messages = [...state.messages];
        }
        break;
      }

      case 'agreed': {
        state.status = 'agreed';
        state.currentPlan = event.data.plan || null;
        state.agentAAgreed = true;
        state.agentBAgreed = true;
        if (event.data.rounds !== undefined) {
          state.rounds = event.data.rounds;
        }
        break;
      }

      case 'stopped': {
        state.status = 'stopped';
        break;
      }

      case 'error': {
        state.status = 'error';
        state.error = event.data.error;
        break;
      }
    }
  }

  function stop() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    state.status = 'stopped';
  }

  return {
    get state() { return state; },
    reset,
    configure,
    start,
    stop,
    intervene
  };
}

// Singleton instance
let planningStore: ReturnType<typeof createPlanningStore> | null = null;

export function usePlanningStore() {
  if (!planningStore) {
    planningStore = createPlanningStore();
  }
  return planningStore;
}
