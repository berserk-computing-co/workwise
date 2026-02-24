/**
 * Provider-agnostic LLM interface.
 *
 * Each provider (Anthropic, OpenAI) implements AiProvider.chat() once,
 * translating generic ChatParams/ChatResponse to/from its SDK format.
 * AgentRunner and pipeline steps code against these types — never a specific SDK.
 */

/** A single message in a multi-turn conversation. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string | ChatContentBlock[];
}

/**
 * Discriminated union on `type`. Only fields relevant to each type are populated.
 * - `'text'`        — uses `text`
 * - `'tool_use'`    — uses `toolCallId`, `toolName`, `toolInput`
 * - `'tool_result'` — uses `toolResultId`, `toolResultContent`, `isError`
 */
export interface ChatContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  toolCallId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResultId?: string;
  toolResultContent?: string;
  isError?: boolean;
}

/** JSON Schema definition for a tool the model can call. */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** Parameters for a single LLM call (one round-trip, not the full agent loop). */
export interface ChatParams {
  model: string;
  system: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  maxTokens?: number;
}

/** A normalized tool call extracted from the model's response. */
export interface ToolCallData {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Normalized response from a single LLM call.
 *
 * AgentRunner inspects `stopReason` to decide what to do next:
 * - `'end_turn'`   → done, `text` is the final answer
 * - `'tool_use'`   → execute `toolCalls[]`, send results, loop
 * - `'max_tokens'` → truncated, handle as error
 */
export interface ChatResponse {
  text: string;
  toolCalls: ToolCallData[];
  stopReason: "end_turn" | "tool_use" | "max_tokens";
  usage: { inputTokens: number; outputTokens: number };
  /** Full assistant content blocks — echoed back into message history between iterations. */
  rawAssistantContent: ChatContentBlock[];
}

/** The contract every LLM provider must implement. */
export interface AiProvider {
  chat(params: ChatParams): Promise<ChatResponse>;
}

/** NestJS injection token for the active AiProvider implementation. */
export const AI_PROVIDER = Symbol("AI_PROVIDER");
