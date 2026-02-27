import { AgentRunner } from "./agent-runner.service.js";
import type { AgentConfig } from "./interfaces/agent.interfaces.js";
import type { ChatResponse } from "./interfaces/provider.interface.js";

const mockProvider = { chat: jest.fn() };

const mockTool = {
  definition: { name: "test_tool", description: "test", inputSchema: {} },
  execute: jest.fn(),
};

const baseConfig: AgentConfig = {
  name: "test_agent",
  model: "test-model",
  systemPrompt: "You are a test agent",
  tools: [mockTool],
  maxIterations: 5,
  maxTokens: 1024,
};

const endTurnResponse = (): ChatResponse => ({
  text: "done",
  toolCalls: [],
  stopReason: "end_turn",
  usage: { inputTokens: 10, outputTokens: 5 },
  rawAssistantContent: [{ type: "text", text: "done" }],
});

const toolUseResponse = (): ChatResponse => ({
  text: "",
  toolCalls: [{ id: "call_1", name: "test_tool", input: { key: "value" } }],
  stopReason: "tool_use",
  usage: { inputTokens: 20, outputTokens: 10 },
  rawAssistantContent: [
    {
      type: "tool_use",
      toolCallId: "call_1",
      toolName: "test_tool",
      toolInput: { key: "value" },
    },
  ],
});

describe("AgentRunner", () => {
  let runner: AgentRunner;
  let signal: AbortSignal;

  beforeEach(() => {
    runner = new AgentRunner(mockProvider as any);
    signal = new AbortController().signal;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns text immediately when provider responds with end_turn", async () => {
    mockProvider.chat.mockResolvedValueOnce(endTurnResponse());

    const result = await runner.run(baseConfig, "hello", signal);

    expect(result.text).toBe("done");
    expect(result.iterations).toBe(0);
    expect(result.toolCallCount).toBe(0);
    expect(result.truncated).toBe(false);
    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
  });

  it("handles tool_use: calls tool.execute(), sends result back as user message, loops until end_turn", async () => {
    mockTool.execute.mockResolvedValueOnce("tool output");
    mockProvider.chat
      .mockResolvedValueOnce(toolUseResponse())
      .mockResolvedValueOnce(endTurnResponse());

    const result = await runner.run(baseConfig, "hello", signal);

    expect(mockTool.execute).toHaveBeenCalledWith({ key: "value" }, signal);
    expect(mockProvider.chat).toHaveBeenCalledTimes(2);

    const secondCallMessages = mockProvider.chat.mock.calls[1][0].messages;
    const lastUserMessage = secondCallMessages[secondCallMessages.length - 1];
    expect(lastUserMessage.role).toBe("user");
    expect(Array.isArray(lastUserMessage.content)).toBe(true);
    expect(lastUserMessage.content[0]).toMatchObject({
      type: "tool_result",
      toolResultId: "call_1",
      toolResultContent: "tool output",
    });

    expect(result.text).toBe("done");
    expect(result.toolCallCount).toBe(1);
    expect(result.truncated).toBe(false);
  });

  it("sends error result for unknown tool name (hallucinated tool)", async () => {
    const hallucinatedResponse: ChatResponse = {
      text: "",
      toolCalls: [{ id: "call_x", name: "fake_tool", input: {} }],
      stopReason: "tool_use",
      usage: { inputTokens: 10, outputTokens: 5 },
      rawAssistantContent: [
        {
          type: "tool_use",
          toolCallId: "call_x",
          toolName: "fake_tool",
          toolInput: {},
        },
      ],
    };

    mockProvider.chat
      .mockResolvedValueOnce(hallucinatedResponse)
      .mockResolvedValueOnce(endTurnResponse());

    await runner.run(baseConfig, "hello", signal);

    const secondCallMessages = mockProvider.chat.mock.calls[1][0].messages;
    const lastUserMessage = secondCallMessages[secondCallMessages.length - 1];
    expect(lastUserMessage.content[0]).toMatchObject({
      type: "tool_result",
      toolResultId: "call_x",
      toolResultContent: 'Error: unknown tool "fake_tool"',
      isError: true,
    });
    expect(mockTool.execute).not.toHaveBeenCalled();
  });

  it("sends error result when tool.execute() throws", async () => {
    mockTool.execute.mockRejectedValueOnce(new Error("tool failed"));
    mockProvider.chat
      .mockResolvedValueOnce(toolUseResponse())
      .mockResolvedValueOnce(endTurnResponse());

    await runner.run(baseConfig, "hello", signal);

    const secondCallMessages = mockProvider.chat.mock.calls[1][0].messages;
    const lastUserMessage = secondCallMessages[secondCallMessages.length - 1];
    expect(lastUserMessage.content[0]).toMatchObject({
      type: "tool_result",
      toolResultId: "call_1",
      toolResultContent: "Error: tool failed",
      isError: true,
    });
  });

  it("handles pause_turn: echoes rawAssistantContent, sends 'continue', loops", async () => {
    const pauseResponse: ChatResponse = {
      text: "",
      toolCalls: [],
      stopReason: "pause_turn",
      usage: { inputTokens: 10, outputTokens: 5 },
      rawAssistantContent: [{ type: "text", text: "searching..." }],
    };

    mockProvider.chat
      .mockResolvedValueOnce(pauseResponse)
      .mockResolvedValueOnce(endTurnResponse());

    const result = await runner.run(baseConfig, "hello", signal);

    expect(mockProvider.chat).toHaveBeenCalledTimes(2);

    const secondCallMessages = mockProvider.chat.mock.calls[1][0].messages;
    const assistantMsg = secondCallMessages[secondCallMessages.length - 2];
    const continueMsg = secondCallMessages[secondCallMessages.length - 1];

    expect(assistantMsg.role).toBe("assistant");
    expect(assistantMsg.content).toEqual([
      { type: "text", text: "searching..." },
    ]);
    expect(continueMsg).toEqual({ role: "user", content: "continue" });

    expect(result.text).toBe("done");
  });

  it("breaks loop and returns last response text when maxIterations exhausted", async () => {
    const config: AgentConfig = { ...baseConfig, maxIterations: 2 };
    mockTool.execute.mockResolvedValue("result");
    mockProvider.chat.mockResolvedValue(toolUseResponse());

    const result = await runner.run(config, "hello", signal);

    expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    expect(result.text).toBe("");
    expect(result.truncated).toBe(false);
  });

  it("breaks loop on unexpected stop reason (max_tokens)", async () => {
    const maxTokensResponse: ChatResponse = {
      text: "truncated",
      toolCalls: [],
      stopReason: "max_tokens",
      usage: { inputTokens: 10, outputTokens: 5 },
      rawAssistantContent: [{ type: "text", text: "truncated" }],
    };

    mockProvider.chat.mockResolvedValueOnce(maxTokensResponse);

    const result = await runner.run(baseConfig, "hello", signal);

    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    expect(result.text).toBe("truncated");
    expect(result.iterations).toBe(0);
    expect(result.truncated).toBe(false);
  });

  it("counts toolCallCount correctly across multiple iterations", async () => {
    mockTool.execute.mockResolvedValue("result");
    mockProvider.chat
      .mockResolvedValueOnce(toolUseResponse())
      .mockResolvedValueOnce(toolUseResponse())
      .mockResolvedValueOnce(endTurnResponse());

    const result = await runner.run(baseConfig, "hello", signal);

    expect(result.toolCallCount).toBe(2);
    expect(result.iterations).toBe(2);
  });

  it("records steps with correct types (llm_response, tool_call)", async () => {
    mockTool.execute.mockResolvedValueOnce("tool result");
    mockProvider.chat
      .mockResolvedValueOnce(toolUseResponse())
      .mockResolvedValueOnce(endTurnResponse());

    const result = await runner.run(baseConfig, "hello", signal);

    const llmSteps = result.steps.filter((s) => s.type === "llm_response");
    const toolSteps = result.steps.filter((s) => s.type === "tool_call");

    expect(llmSteps).toHaveLength(2);
    expect(toolSteps).toHaveLength(1);

    for (const step of result.steps) {
      expect(step.timestamp).toBeInstanceOf(Date);
      expect(typeof step.latencyMs).toBe("number");
      expect(step.latencyMs).toBeGreaterThanOrEqual(0);
    }

    expect(llmSteps[0].data.stopReason).toBe("tool_use");
    expect(toolSteps[0].data.name).toBe("test_tool");
    expect(toolSteps[0].data.output).toBe("tool result");
  });

  it("serializes non-string tool results via JSON.stringify", async () => {
    const objectResult = { price: 42, unit: "each" };
    mockTool.execute.mockResolvedValueOnce(objectResult);
    mockProvider.chat
      .mockResolvedValueOnce(toolUseResponse())
      .mockResolvedValueOnce(endTurnResponse());

    const result = await runner.run(baseConfig, "hello", signal);

    const toolStep = result.steps.find((s) => s.type === "tool_call");
    expect(toolStep?.data.output).toBe(JSON.stringify(objectResult));

    const secondCallMessages = mockProvider.chat.mock.calls[1][0].messages;
    const lastUserMessage = secondCallMessages[secondCallMessages.length - 1];
    expect(lastUserMessage.content[0].toolResultContent).toBe(
      JSON.stringify(objectResult),
    );
  });
});
