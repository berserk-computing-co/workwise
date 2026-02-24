/**
 * Types for the AgentRunner multi-turn tool-use loop.
 *
 * AgentConfig (what to do) → AgentRunner.run() → AgentResult (what happened)
 */

import type { ToolDefinition } from "./provider.interface.js";

/**
 * Pairs a tool definition (sent to the model) with its local execute function
 * (called by AgentRunner when the model invokes it).
 */
export interface AgentTool {
  definition: ToolDefinition;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

/** Configuration for a single agent run. Immutable for the duration of the run. */
export interface AgentConfig {
  /** For logging (e.g. `'onebuild_resolution'`). */
  name: string;
  /** Provider-specific model ID. */
  model: string;
  systemPrompt: string;
  tools: AgentTool[];
  /** Safety cap on tool-use round-trips. */
  maxIterations: number;
  maxTokens?: number;
}

/** A single recorded event from an agent run (LLM response, tool call, or tool result). */
export interface AgentStep {
  type: "llm_response" | "tool_call" | "tool_result";
  timestamp: Date;
  data: Record<string, unknown>;
  latencyMs: number;
}

/**
 * Output of a completed agent run.
 * `text` is the model's final response — parse as JSON for structured output.
 * `steps` is the full trace for debugging and cost tracking.
 */
export interface AgentResult {
  text: string;
  steps: AgentStep[];
  iterations: number;
  toolCallCount: number;
}
