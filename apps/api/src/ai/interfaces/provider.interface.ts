/**
 * Provider-agnostic LLM interface.
 * Each provider (Anthropic, OpenAI, etc.) implements this once.
 * The AgentRunner and all agents code against this — never a specific SDK.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | ChatContentBlock[];
}

export interface ChatContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  // text block
  text?: string;
  // tool_use block
  toolCallId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  // tool_result block
  toolResultId?: string;
  toolResultContent?: string;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;    // JSON Schema
}

export interface ChatParams {
  model: string;
  system: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  maxTokens?: number;
}

export interface ToolCallData {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ChatResponse {
  text: string;                            // Concatenated text blocks (empty if only tool calls)
  toolCalls: ToolCallData[];               // Normalized tool call blocks
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
  usage: { inputTokens: number; outputTokens: number };
  rawAssistantContent: ChatContentBlock[]; // Provider-normalized content for conversation history
}

export interface AiProvider {
  chat(params: ChatParams): Promise<ChatResponse>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
