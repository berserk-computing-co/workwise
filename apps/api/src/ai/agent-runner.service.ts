import { Inject, Injectable, Logger } from "@nestjs/common";
import type {
  AiProvider,
  ChatMessage,
  ChatContentBlock,
} from "./interfaces/provider.interface.js";
import { AI_PROVIDER } from "./interfaces/provider.interface.js";
import type {
  AgentConfig,
  AgentResult,
  AgentStep,
  AgentTool,
} from "./interfaces/agent.interfaces.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5_000;

function parseRetryAfter(error: unknown): number | null {
  if (
    error &&
    typeof error === "object" &&
    "headers" in error &&
    error.headers &&
    typeof error.headers === "object" &&
    "get" in error.headers &&
    typeof error.headers.get === "function"
  ) {
    const val = error.headers.get("retry-after");
    if (val) {
      const secs = Number(val);
      if (!Number.isNaN(secs) && secs > 0) return secs * 1000;
    }
  }
  return null;
}

function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status: number }).status === 429;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return msg.startsWith("429 ");
}

@Injectable()
export class AgentRunner {
  private readonly logger = new Logger(AgentRunner.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  private async chatWithRetry(
    params: Parameters<AiProvider["chat"]>[0],
    agentName: string,
  ): ReturnType<AiProvider["chat"]> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.provider.chat(params);
      } catch (err) {
        if (!isRateLimitError(err) || attempt === MAX_RETRIES) throw err;

        const retryAfterMs =
          parseRetryAfter(err) ??
          BASE_DELAY_MS * Math.pow(2, attempt);

        this.logger.warn(
          `[${agentName}] Rate limited (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${Math.round(retryAfterMs / 1000)}s...`,
        );

        await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      }
    }
    throw new Error("unreachable");
  }

  async run(config: AgentConfig, initialPrompt: string): Promise<AgentResult> {
    const { maxTokens, model, systemPrompt, tools, serverTools, outputFormat } =
      config;
    const messages: ChatMessage[] = [{ role: "user", content: initialPrompt }];
    const toolMap = new Map<string, AgentTool>(
      tools.map((t) => [t.definition.name, t]),
    );

    const steps: AgentStep[] = [];
    let iterations = 0;
    let toolCallCount = 0;

    this.logger.log(
      `[${config.name}] Starting agent loop (model=${model}, maxIter=${config.maxIterations}, tools=[${tools.map((t) => t.definition.name).join(", ")}], serverTools=${serverTools?.length ?? 0})`,
    );

    while (iterations < config.maxIterations) {
      const start = Date.now();

      let response;
      try {
        response = await this.chatWithRetry(
          {
            model,
            system: systemPrompt,
            messages,
            tools: tools.map((t) => t.definition),
            serverTools,
            maxTokens,
            outputFormat,
          },
          config.name,
        );
      } catch (apiError) {
        const msg =
          apiError instanceof Error ? apiError.message : String(apiError);
        this.logger.error(
          `[${config.name}] API call failed on iteration ${iterations}: ${msg}`,
          apiError instanceof Error ? apiError.stack : undefined,
        );
        throw apiError;
      }

      const latencyMs = Date.now() - start;

      this.logger.debug(
        `[${config.name}] iter=${iterations} stop=${response.stopReason} tools=${response.toolCalls.length} latency=${latencyMs}ms tokens=${response.usage.inputTokens}in/${response.usage.outputTokens}out`,
      );

      steps.push({
        type: "llm_response",
        timestamp: new Date(),
        data: {
          stopReason: response.stopReason,
          text: response.text,
          usage: response.usage,
        },
        latencyMs,
      });

      // DONE — model finished on its own
      if (response.stopReason === "end_turn") {
        this.logger.log(
          `[${config.name}] Completed: ${iterations} iterations, ${toolCallCount} tool calls, output=${response.text.length} chars`,
        );
        return { text: response.text, steps, iterations, toolCallCount };
      }

      // PAUSE TURN — server tool loop hit max iterations, echo and continue
      if (response.stopReason === "pause_turn") {
        this.logger.debug(
          `[${config.name}] pause_turn at iteration ${iterations}, sending continue`,
        );
        messages.push({
          role: "assistant",
          content: response.rawAssistantContent,
        });
        messages.push({ role: "user", content: "continue" });
        iterations++;
        continue;
      }

      // TOOL USE — model wants to call local tool(s)
      if (response.stopReason === "tool_use") {
        // Echo the full assistant response (text + tool_use blocks) into history
        messages.push({
          role: "assistant",
          content: response.rawAssistantContent,
        });

        // Execute each tool call and build result blocks
        const toolResultBlocks: ChatContentBlock[] = [];

        for (const call of response.toolCalls) {
          const tool = toolMap.get(call.name);
          const toolStart = Date.now();

          if (!tool) {
            // Model hallucinated a tool name — send error back so it can self-correct
            toolResultBlocks.push({
              type: "tool_result",
              toolResultId: call.id,
              toolResultContent: `Error: unknown tool "${call.name}"`,
              isError: true,
            });
            continue;
          }

          try {
            const result = await tool.execute(call.input);
            const serialized =
              typeof result === "string" ? result : JSON.stringify(result);

            steps.push({
              type: "tool_call",
              timestamp: new Date(),
              data: { name: call.name, input: call.input, output: serialized },
              latencyMs: Date.now() - toolStart,
            });

            toolResultBlocks.push({
              type: "tool_result",
              toolResultId: call.id,
              toolResultContent: serialized,
            });
          } catch (err) {
            // Tool execution failed — let the model know so it can retry or bail
            const errorMsg = err instanceof Error ? err.message : String(err);

            steps.push({
              type: "tool_call",
              timestamp: new Date(),
              data: { name: call.name, input: call.input, error: errorMsg },
              latencyMs: Date.now() - toolStart,
            });

            toolResultBlocks.push({
              type: "tool_result",
              toolResultId: call.id,
              toolResultContent: `Error: ${errorMsg}`,
              isError: true,
            });
          }

          toolCallCount++;
        }

        // Send all tool results back as a single user message and loop
        messages.push({ role: "user", content: toolResultBlocks });
        iterations++;
        continue;
      }

      // MAX_TOKENS — response was truncated, bail out
      this.logger.warn(
        `[${config.name}] Unexpected stop reason: ${response.stopReason} after ${iterations} iterations`,
      );
      break;
    }

    // Exhausted maxIterations or hit unexpected stop — return whatever we have
    const lastResponse = steps.filter((s) => s.type === "llm_response").at(-1);
    return {
      text: (lastResponse?.data?.text as string) ?? "",
      steps,
      iterations,
      toolCallCount,
    };
  }
}
