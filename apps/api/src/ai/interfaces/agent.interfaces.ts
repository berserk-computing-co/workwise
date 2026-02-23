import type { ToolDefinition } from './provider.interface.js';

export interface AgentTool {
  definition: ToolDefinition;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentConfig {
  name: string;                   // For logging ("onebuild_resolution", "scope_decomposition")
  model: string;                  // Provider-specific model ID
  systemPrompt: string;           // Role + schema docs + instructions
  tools: AgentTool[];             // Tools available to this agent
  maxIterations: number;          // Safety cap on tool-use loops
  maxTokens?: number;             // Per-response token limit (default 4096)
}

export interface AgentStep {
  type: 'llm_response' | 'tool_call' | 'tool_result';
  timestamp: Date;
  data: Record<string, unknown>;
  latencyMs: number;
}

export interface AgentResult {
  text: string;                   // Final text response (parse as JSON if structured output)
  steps: AgentStep[];             // Full trace for debugging/cost tracking
  iterations: number;
  toolCallCount: number;
}
