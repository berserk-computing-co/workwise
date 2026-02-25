import { ScopeDecompositionStep } from "./scope-decomposition.step.js";
import { ItemCategory } from "../bidengine.enums.js";
import type { BidEngineContext } from "../bidengine-context.js";

const validResponseText = JSON.stringify({
  sections: [
    {
      name: "Framing",
      labor_hours: 16,
      items: [
        {
          description: "2x4 lumber",
          quantity: 100,
          unit: "LF",
          unit_cost: 3.5,
          category: ItemCategory.Material,
        },
      ],
    },
  ],
  confidence: 0.85,
});

const mockChatResponse = {
  text: validResponseText,
  stopReason: "end_turn",
  toolCalls: [],
  usage: { inputTokens: 100, outputTokens: 200 },
  rawAssistantContent: [],
};

describe("ScopeDecompositionStep", () => {
  let mockProvider: { chat: jest.Mock };
  let step: ScopeDecompositionStep;
  let context: BidEngineContext;

  beforeEach(() => {
    mockProvider = { chat: jest.fn().mockResolvedValue(mockChatResponse) };
    step = new ScopeDecompositionStep(mockProvider as any);
    context = {
      projectId: "proj-1",
      description: "Replace kitchen plumbing",
      address: "123 Main St",
      zipCode: "90210",
      category: "plumbing",
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('name equals "scope_decomposition"', () => {
    expect(step.name).toBe("scope_decomposition");
  });

  it('execute() calls provider.chat with model "claude-sonnet-4-6" and maxTokens 8192', async () => {
    await step.execute(context);

    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    const callArgs = mockProvider.chat.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-6");
    expect(callArgs.maxTokens).toBe(8192);
  });

  it("execute() populates context.sections with snake_case→camelCase mapping (unit_cost → unitCost)", async () => {
    await step.execute(context);

    expect(context.sections).toBeDefined();
    expect(context.sections).toHaveLength(1);

    const section = context.sections![0];
    expect(section.name).toBe("Framing");
    expect(section.labor_hours).toBe(16);
    expect(section.items).toHaveLength(1);

    const item = section.items[0];
    expect(item.description).toBe("2x4 lumber");
    expect(item.quantity).toBe(100);
    expect(item.unit).toBe("LF");
    expect(item.unitCost).toBe(3.5);
    expect(item.category).toBe(ItemCategory.Material);
  });

  it('execute() throws when stopReason !== "end_turn"', async () => {
    mockProvider.chat.mockResolvedValueOnce({
      ...mockChatResponse,
      stopReason: "max_tokens",
    });

    await expect(step.execute(context)).rejects.toThrow(
      'ScopeDecompositionStep: unexpected stop_reason "max_tokens"',
    );
  });
});
