const mockCreate = jest.fn();

jest.mock("@anthropic-ai/sdk", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

import { AnthropicProvider } from "./anthropic.provider.js";
import type { ChatParams } from "../interfaces/provider.interface.js";

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue("test-api-key"),
};

const baseParams: ChatParams = {
  model: "claude-sonnet-4-6",
  system: "You are a helpful assistant",
  messages: [{ role: "user", content: "hello" }],
  maxTokens: 1024,
};

const baseResponse = {
  content: [{ type: "text", text: "Hello" }],
  stop_reason: "end_turn",
  usage: { input_tokens: 10, output_tokens: 5 },
};

describe("AnthropicProvider", () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider(mockConfig as any);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls Anthropic messages.create with correct parameters", async () => {
    mockCreate.mockResolvedValueOnce(baseResponse);

    await provider.chat(baseParams);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
      }),
    );
  });

  it("includes cache_control ephemeral on system message", async () => {
    mockCreate.mockResolvedValueOnce(baseResponse);

    await provider.chat(baseParams);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toEqual([
      {
        type: "text",
        text: "You are a helpful assistant",
        cache_control: { type: "ephemeral" },
      },
    ]);
  });

  it("adds strict: true to tool definitions", async () => {
    mockCreate.mockResolvedValueOnce(baseResponse);

    await provider.chat({
      ...baseParams,
      tools: [
        {
          name: "my_tool",
          description: "does stuff",
          inputSchema: { type: "object" },
        },
      ],
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "my_tool",
          strict: true,
        }),
      ]),
    );
  });

  it("includes output_config.format when outputFormat provided", async () => {
    mockCreate.mockResolvedValueOnce(baseResponse);

    await provider.chat({
      ...baseParams,
      outputFormat: { type: "json_schema", schema: { type: "object" } },
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.output_config).toEqual({
      format: {
        type: "json_schema",
        schema: { type: "object" },
      },
    });
  });

  it("omits tools when no tools and no serverTools", async () => {
    mockCreate.mockResolvedValueOnce(baseResponse);

    await provider.chat({
      ...baseParams,
      tools: undefined,
      serverTools: undefined,
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.tools).toBeUndefined();
  });

  it("omits tools when tools is empty and serverTools is empty", async () => {
    mockCreate.mockResolvedValueOnce(baseResponse);

    await provider.chat({ ...baseParams, tools: [], serverTools: [] });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.tools).toBeUndefined();
  });

  it("extracts text from TextBlock responses", async () => {
    mockCreate.mockResolvedValueOnce({
      ...baseResponse,
      content: [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ],
    });

    const result = await provider.chat(baseParams);

    expect(result.text).toBe("Hello world");
  });

  it("extracts toolCalls from ToolUseBlock responses", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          id: "call_abc",
          name: "search",
          input: { query: "test" },
        },
      ],
      stop_reason: "tool_use",
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const result = await provider.chat(baseParams);

    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0]).toEqual({
      id: "call_abc",
      name: "search",
      input: { query: "test" },
    });
  });

  it.each([
    ["end_turn", "end_turn"],
    ["tool_use", "tool_use"],
    ["pause_turn", "pause_turn"],
    ["refusal", "refusal"],
    ["max_tokens", "max_tokens"],
    ["unknown_reason", "max_tokens"],
  ])("maps stop_reason '%s' to '%s'", async (sdkReason, expected) => {
    mockCreate.mockResolvedValueOnce({
      ...baseResponse,
      stop_reason: sdkReason,
    });

    const result = await provider.chat(baseParams);

    expect(result.stopReason).toBe(expected);
  });

  it("filters thinking and redacted_thinking from rawAssistantContent", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        { type: "thinking", thinking: "internal reasoning" },
        { type: "redacted_thinking", data: "encrypted" },
        { type: "text", text: "final answer" },
      ],
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const result = await provider.chat(baseParams);

    expect(result.rawAssistantContent).toHaveLength(1);
    expect(result.rawAssistantContent[0]).toEqual({
      type: "text",
      text: "final answer",
    });
  });

  it("echoes server_tool_use in rawAssistantContent", async () => {
    const serverToolBlock = {
      type: "server_tool_use",
      id: "stool_1",
      name: "web_search",
      input: { query: "material costs" },
    };

    mockCreate.mockResolvedValueOnce({
      content: [serverToolBlock],
      stop_reason: "pause_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const result = await provider.chat(baseParams);

    expect(result.rawAssistantContent).toHaveLength(1);
    expect(result.rawAssistantContent[0]).toMatchObject({
      type: "server_tool_use",
      toolCallId: "stool_1",
      toolName: "web_search",
      rawBlock: serverToolBlock,
    });
  });

  it("echoes web_search_tool_result in rawAssistantContent", async () => {
    const searchResultBlock = {
      type: "web_search_tool_result",
      tool_use_id: "stool_1",
      content: [
        {
          type: "web_search_result",
          url: "https://example.com",
          title: "Test",
        },
      ],
    };

    mockCreate.mockResolvedValueOnce({
      content: [searchResultBlock],
      stop_reason: "tool_use",
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const result = await provider.chat(baseParams);

    expect(result.rawAssistantContent).toHaveLength(1);
    expect(result.rawAssistantContent[0]).toMatchObject({
      type: "server_tool_result",
      toolCallId: "stool_1",
      rawBlock: searchResultBlock,
    });
  });

  it("normalizes usage tokens from SDK response", async () => {
    mockCreate.mockResolvedValueOnce({
      ...baseResponse,
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const result = await provider.chat(baseParams);

    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
  });

  it("passes string message content through to SDK", async () => {
    mockCreate.mockResolvedValueOnce(baseResponse);

    await provider.chat({
      ...baseParams,
      messages: [{ role: "user", content: "plain text message" }],
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0]).toEqual({
      role: "user",
      content: "plain text message",
    });
  });

  it("converts block array message content to Anthropic format", async () => {
    mockCreate.mockResolvedValueOnce(baseResponse);

    await provider.chat({
      ...baseParams,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              toolResultId: "call_1",
              toolResultContent: "result text",
              isError: false,
            },
          ],
        },
      ],
    });

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0];
    expect(Array.isArray(userMessage.content)).toBe(true);
    expect(userMessage.content[0]).toMatchObject({
      type: "tool_result",
      tool_use_id: "call_1",
      content: "result text",
    });
  });
});
