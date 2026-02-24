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
      cache_control: { type: "ephemeral" },
      ...((params.tools?.length || params.serverTools?.length) && {
        tools: [
          ...(params.tools?.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
            strict: true,
          })) ?? []),
          ...(params.serverTools ?? []),
        ] as Anthropic.Messages.ToolUnion[],
      }),
      ...(params.outputFormat && {
        output_config: {
          format: {
            type: "json_schema" as const,
            schema: params.outputFormat.schema,
          },
        },
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

    // Echo text, tool_use, and server tool blocks into history.
    // Skip thinking/redacted_thinking blocks.
    const rawAssistantContent: ChatContentBlock[] = response.content
      .filter(
        (b) =>
          b.type === "text" ||
          b.type === "tool_use" ||
          b.type === "server_tool_use" ||
          b.type === "web_search_tool_result",
      )
      .map((block): ChatContentBlock => {
        if (block.type === "text") {
          return { type: "text", text: block.text };
        }
        if (block.type === "tool_use") {
          const tb = block as Anthropic.ToolUseBlock;
          return {
            type: "tool_use",
            toolCallId: tb.id,
            toolName: tb.name,
            toolInput: tb.input as Record<string, unknown>,
          };
        }
        // Server tool blocks — echo the raw SDK block so the provider can
        // reconstruct them verbatim when building the next request.
        if (block.type === "server_tool_use") {
          const stb = block as Anthropic.ServerToolUseBlock;
          return {
            type: "server_tool_use",
            toolCallId: stb.id,
            toolName: stb.name,
            toolInput: stb.input as Record<string, unknown>,
            rawBlock: block,
          };
        }
        // web_search_tool_result (and other server tool results)
        return {
          type: "server_tool_result",
          toolCallId: (block as Anthropic.WebSearchToolResultBlock).tool_use_id,
          rawBlock: block,
        };
      });

    const stopReason =
      response.stop_reason === "end_turn"
        ? "end_turn"
        : response.stop_reason === "tool_use"
          ? "tool_use"
          : response.stop_reason === "pause_turn"
            ? "pause_turn"
            : response.stop_reason === "refusal"
              ? "refusal"
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

      case "server_tool_use":
      case "server_tool_result":
        // Server tool blocks are stored as raw SDK objects — pass through verbatim.
        return block.rawBlock as ContentBlockParam;
    }
  }
}
