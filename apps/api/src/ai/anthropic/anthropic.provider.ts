import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import type {
  AiProvider,
  ChatParams,
  ChatResponse,
  ChatMessage,
  ChatContentBlock,
} from "../interfaces/provider.interface.js";

/**
 * Anthropic SDK implementation of AiProvider.
 *
 * Only file that imports `@anthropic-ai/sdk`. Translates:
 *   Inbound:  ChatParams → Anthropic Messages API request
 *   Outbound: Anthropic response → ChatResponse
 */
@Injectable()
export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic;

  constructor(config: ConfigService) {
    this.client = new Anthropic({
      apiKey: config.getOrThrow<string>("ANTHROPIC_API_KEY"),
    });
  }

  /** Single Anthropic Messages API call → normalized ChatResponse. */
  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 8192,
      system: params.system,
      messages: this.toAnthropicMessages(params.messages),
      ...(params.tools?.length && {
        tools: params.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
        })),
      }),
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const toolCalls = response.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((b) => ({
        id: b.id,
        name: b.name,
        input: b.input as Record<string, unknown>,
      }));

    // Skip thinking/redacted_thinking blocks — only echo text + tool_use
    const rawAssistantContent: ChatContentBlock[] = response.content
      .filter((b) => b.type === "text" || b.type === "tool_use")
      .map((block): ChatContentBlock => {
        if (block.type === "text") {
          return { type: "text", text: block.text };
        }
        const tb = block as Anthropic.ToolUseBlock;
        return {
          type: "tool_use",
          toolCallId: tb.id,
          toolName: tb.name,
          toolInput: tb.input as Record<string, unknown>,
        };
      });

    const stopReason =
      response.stop_reason === "end_turn"
        ? "end_turn"
        : response.stop_reason === "tool_use"
          ? "tool_use"
          : "max_tokens";

    return {
      text,
      toolCalls,
      stopReason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      rawAssistantContent,
    };
  }

  /** ChatMessage[] → Anthropic MessageParam[] (camelCase → snake_case). */
  private toAnthropicMessages(messages: ChatMessage[]): MessageParam[] {
    return messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : msg.content.map((block) => this.toAnthropicBlock(block)),
    }));
  }

  /** ChatContentBlock → Anthropic ContentBlockParam. */
  private toAnthropicBlock(block: ChatContentBlock): ContentBlockParam {
    switch (block.type) {
      case "text":
        return { type: "text", text: block.text! };

      case "tool_use":
        return {
          type: "tool_use",
          id: block.toolCallId!,
          name: block.toolName!,
          input: block.toolInput!,
        };

      case "tool_result":
        return {
          type: "tool_result",
          tool_use_id: block.toolResultId!,
          content: block.toolResultContent ?? "",
          is_error: block.isError,
        } as ToolResultBlockParam;
    }
  }
}
