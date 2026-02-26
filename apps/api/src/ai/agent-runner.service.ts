import { Inject, Injectable, Logger } from "@nestjs/common";
import type {
  AiProvider,
  ChatMessage,
  ChatContentBlock,
  ChatResponse,
} from "./interfaces/provider.interface.js";
import { AI_PROVIDER } from "./interfaces/provider.interface.js";
import type {
  AgentConfig,
  AgentResult,
  AgentStep,
  AgentTool,
} from "./interfaces/agent.interfaces.js";
import { isRateLimitError, parseRetryAfter } from "./utils/retry.util.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5_000;

/** Minimum output tokens for the Phase 2 formatting call. */
const PHASE2_MIN_TOKENS = 16_384;

@Injectable()
export class AgentRunner {
  private readonly logger = new Logger(AgentRunner.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

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

    // Two-phase mode: when agent has both tools AND outputFormat, keep them
    // separate to prevent the model from shortcutting to JSON output without
    // calling tools first (a known cross-provider anti-pattern).
    //   Phase 1: tool-use loop WITHOUT outputFormat — model gathers data freely
    //   Phase 2: single call WITH outputFormat but NO tools — model formats results
    const hasTools = tools.length > 0 || (serverTools?.length ?? 0) > 0;
    const twoPhase = hasTools && !!outputFormat;

    this.logger.log(
      `[${config.name}] Starting agent loop (model=${model}, maxIter=${config.maxIterations}, tools=[${tools.map((t) => t.definition.name).join(", ")}], serverTools=${serverTools?.length ?? 0}${twoPhase ? ", twoPhase=true" : ""})`,
    );

    // ── Phase 1: tool-use loop ──────────────────────────────────────────
    while (iterations < config.maxIterations) {
      const start = Date.now();

      let response: ChatResponse;
      try {
        response = await this.chatWithRetry(
          {
            model,
            system: systemPrompt,
            messages,
            tools: tools.map((t) => t.definition),
            serverTools,
            maxTokens,
            // Omit outputFormat in two-phase so the model can't shortcut to JSON
            outputFormat: twoPhase ? undefined : outputFormat,
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

      toolCallCount += this.countServerToolUses(response, config.name);

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
        if (!twoPhase) {
          this.logger.log(
            `[${config.name}] Completed: ${iterations} iterations, ${toolCallCount} tool calls, output=${response.text.length} chars`,
          );
          return { text: response.text, steps, iterations, toolCallCount, truncated: false };
        }
        messages.push({
          role: "assistant",
          content: response.rawAssistantContent,
        });
        break;
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
        messages.push({
          role: "assistant",
          content: response.rawAssistantContent,
        });

        const { blocks, callCount, callSteps } = await this.executeToolCalls(
          response.toolCalls,
          toolMap,
          config.name,
        );

        toolCallCount += callCount;
        steps.push(...callSteps);
        messages.push({ role: "user", content: blocks });
        iterations++;
        continue;
      }

      // MAX_TOKENS or unexpected — bail out to Phase 2 (or return)
      this.logger.warn(
        `[${config.name}] Unexpected stop reason: ${response.stopReason} after ${iterations} iterations`,
      );
      if (twoPhase) {
        messages.push({
          role: "assistant",
          content: response.rawAssistantContent,
        });
      }
      break;
    }

    // ── Phase 2: format gathered data into structured output ─────────────
    if (twoPhase) {
      return this.runFormattingPhase(config, messages, steps, {
        iterations,
        toolCallCount,
      });
    }

    // Non-two-phase: exhausted maxIterations — return whatever we have
    const lastResponse = steps.filter((s) => s.type === "llm_response").at(-1);
    return {
      text: (lastResponse?.data?.text as string) ?? "",
      steps,
      iterations,
      toolCallCount,
      truncated: false,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────

  /** Count server tool uses (web_search etc.) that are executed API-side. */
  private countServerToolUses(
    response: ChatResponse,
    agentName: string,
  ): number {
    const count = response.rawAssistantContent.filter(
      (b) => b.type === "server_tool_use",
    ).length;
    if (count > 0) {
      this.logger.debug(
        `[${agentName}] ${count} server tool call(s) in this iteration`,
      );
    }
    return count;
  }

  /** Execute local tool calls and return result blocks + step records. */
  private async executeToolCalls(
    toolCalls: ChatResponse["toolCalls"],
    toolMap: Map<string, AgentTool>,
    agentName: string,
  ): Promise<{
    blocks: ChatContentBlock[];
    callCount: number;
    callSteps: AgentStep[];
  }> {
    const blocks: ChatContentBlock[] = [];
    const callSteps: AgentStep[] = [];
    let callCount = 0;

    for (const call of toolCalls) {
      const tool = toolMap.get(call.name);
      const toolStart = Date.now();

      if (!tool) {
        blocks.push({
          type: "tool_result",
          toolResultId: call.id,
          toolResultContent: `Error: unknown tool "${call.name}"`,
          isError: true,
        });
        continue;
      }

      try {
        this.logger.debug(
          `[${agentName}] tool=${call.name} input=${JSON.stringify(call.input)}`,
        );

        const result = await tool.execute(call.input);
        const serialized =
          typeof result === "string" ? result : JSON.stringify(result);

        const resultObj =
          typeof result === "object" && result !== null ? result : null;
        const resultCount =
          resultObj && "result_count" in resultObj
            ? (resultObj as { result_count: number }).result_count
            : serialized.length;

        this.logger.debug(
          `[${agentName}] tool=${call.name} result_count=${resultCount} latency=${Date.now() - toolStart}ms`,
        );

        callSteps.push({
          type: "tool_call",
          timestamp: new Date(),
          data: { name: call.name, input: call.input, output: serialized },
          latencyMs: Date.now() - toolStart,
        });

        blocks.push({
          type: "tool_result",
          toolResultId: call.id,
          toolResultContent: serialized,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        this.logger.warn(
          `[${agentName}] tool=${call.name} FAILED: ${errorMsg} (input=${JSON.stringify(call.input)})`,
        );

        callSteps.push({
          type: "tool_call",
          timestamp: new Date(),
          data: { name: call.name, input: call.input, error: errorMsg },
          latencyMs: Date.now() - toolStart,
        });

        blocks.push({
          type: "tool_result",
          toolResultId: call.id,
          toolResultContent: `Error: ${errorMsg}`,
          isError: true,
        });
      }

      callCount++;
    }

    return { blocks, callCount, callSteps };
  }

  /** Phase 2: single LLM call with outputFormat and no tools to format results. */
  private async runFormattingPhase(
    config: AgentConfig,
    messages: ChatMessage[],
    steps: AgentStep[],
    counters: { iterations: number; toolCallCount: number },
  ): Promise<AgentResult> {
    const { model, systemPrompt, maxTokens, outputFormat } = config;

    this.logger.log(
      `[${config.name}] Phase 2: formatting output (${counters.toolCallCount} tool calls gathered)`,
    );

    const formatInstruction =
      "Now produce your final structured JSON output based on all the data you gathered above. Include every item from the original list — use the search results where available and mark items as unmatched where no data was found.";

    // Ensure valid message alternation — if messages end with a user turn
    // (e.g. tool results after maxIterations exhaustion), append to it.
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "user") {
      if (typeof lastMsg.content === "string") {
        lastMsg.content += "\n\n" + formatInstruction;
      } else {
        (lastMsg.content as ChatContentBlock[]).push({
          type: "text",
          text: formatInstruction,
        });
      }
    } else {
      messages.push({ role: "user", content: formatInstruction });
    }

    // Formatting needs more room than tool-use iterations — the entire
    // structured JSON must fit in one response.
    const phase2MaxTokens = Math.max(maxTokens ?? 8192, PHASE2_MIN_TOKENS);

    const start = Date.now();
    let formatResponse: ChatResponse;
    try {
      formatResponse = await this.chatWithRetry(
        {
          model,
          system: systemPrompt,
          messages,
          maxTokens: phase2MaxTokens,
          outputFormat,
        },
        config.name,
      );
    } catch (apiError) {
      const msg =
        apiError instanceof Error ? apiError.message : String(apiError);
      this.logger.error(
        `[${config.name}] Phase 2 formatting failed: ${msg}`,
        apiError instanceof Error ? apiError.stack : undefined,
      );
      throw apiError;
    }

    const latencyMs = Date.now() - start;
    this.logger.debug(
      `[${config.name}] Phase 2 complete: latency=${latencyMs}ms tokens=${formatResponse.usage.inputTokens}in/${formatResponse.usage.outputTokens}out`,
    );

    steps.push({
      type: "llm_response",
      timestamp: new Date(),
      data: {
        stopReason: formatResponse.stopReason,
        text: formatResponse.text,
        usage: formatResponse.usage,
        phase: "format",
      },
      latencyMs,
    });

    const truncated = formatResponse.stopReason === "max_tokens";
    if (truncated) {
      this.logger.warn(
        `[${config.name}] Phase 2 output truncated (max_tokens=${phase2MaxTokens}, output=${formatResponse.text.length} chars) — JSON may be incomplete`,
      );
    }

    this.logger.log(
      `[${config.name}] Completed: ${counters.iterations} iterations, ${counters.toolCallCount} tool calls, output=${formatResponse.text.length} chars (two-phase${truncated ? ", truncated" : ""})`,
    );

    return {
      text: formatResponse.text,
      steps,
      iterations: counters.iterations,
      toolCallCount: counters.toolCallCount,
      truncated,
    };
  }

  /** LLM call with exponential-backoff retry on 429 rate limits. */
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
}
