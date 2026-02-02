/**
 * OpenRouter model information
 */
export interface Model {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    context_length: number;
    max_completion_tokens?: number;
  };
}

/**
 * Message roles in the planning conversation
 */
export type MessageRole = 'agent-a' | 'agent-b' | 'human' | 'system';

/**
 * Tool types available to planning agents
 */
export type ToolType = 'think' | 'propose_plan' | 'critique' | 'ask_question' | 'agree' | 'respond';

/**
 * A message in the planning conversation
 */
export interface PlanningMessage {
  id: string;
  role: MessageRole;
  content: string;
  tool?: ToolType;
  timestamp: number;
  isStreaming?: boolean;
}

/**
 * The current state of planning
 */
export interface PlanningState {
  status: 'idle' | 'configuring' | 'planning' | 'agreed' | 'stopped' | 'error';
  prompt: string;
  modelA: string | null;
  modelB: string | null;
  messages: PlanningMessage[];
  currentPlan: string | null;
  agentAAgreed: boolean;
  agentBAgreed: boolean;
  rounds: number;
  error?: string;
}

/**
 * Configuration for starting a planning session
 */
export interface PlanningConfig {
  prompt: string;
  modelA: string;
  modelB: string;
}

/**
 * A tool call from an agent
 */
export interface ToolCall {
  type: ToolType;
  content: string;
}

/**
 * Parsed agent response
 */
export interface AgentResponse {
  thinking?: string;
  toolCall: ToolCall;
  rawContent: string;
}

/**
 * SSE event types
 */
export type SSEEventType =
  | 'message'      // New message from an agent
  | 'thinking'     // Agent is thinking (streaming)
  | 'tool'         // Agent used a tool
  | 'agreed'       // Both agents agreed
  | 'stopped'      // Planning was stopped
  | 'error';       // An error occurred

/**
 * SSE event data
 */
export interface SSEEvent {
  type: SSEEventType;
  data: {
    role?: MessageRole;
    content?: string;
    tool?: ToolType;
    plan?: string;
    error?: string;
    messageId?: string;
    rounds?: number;
  };
}
