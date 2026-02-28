import { ScopeDecompositionStep } from "./scope-decomposition.step.js";
import { ItemCategory } from "../bidengine.enums.js";
import type { BidEngineContext } from "../bidengine-context.js";

const validResponseText = JSON.stringify({
  project_type: "construction",
  classification_reasoning:
    "Replacing kitchen plumbing is a construction project involving physical pipe and fixture work.",
  sections: [
    {
      name: "Framing",
      labor_hours: 16,
      items: [
        {
          description: "2x4 lumber",
          quantity: 100,
          unit: "LF",
          category: ItemCategory.Material,
          pricing_hint: "material",
          confidence: "high",
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

  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
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

  it('execute() calls provider.chat with model "claude-haiku-4-5-20251001" and maxTokens 16384', async () => {
    await step.execute(context, signal);

    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    const callArgs = mockProvider.chat.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-haiku-4-5-20251001");
    expect(callArgs.maxTokens).toBe(16384);
    expect(callArgs.thinking).toEqual({ type: "enabled", budgetTokens: 8000 });
  });

  it("execute() populates context.projectType from classification", async () => {
    await step.execute(context, signal);

    expect(context.projectType).toBe("construction");
  });

  it("execute() populates context.sections with parsed items and pricing_hint", async () => {
    await step.execute(context, signal);

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
    expect(item.category).toBe(ItemCategory.Material);
    expect(item.pricing_hint).toBe("material");
    expect(item.confidence).toBe("high");
  });

  it('execute() throws when stopReason !== "end_turn"', async () => {
    mockProvider.chat.mockResolvedValueOnce({
      ...mockChatResponse,
      stopReason: "max_tokens",
    });

    await expect(step.execute(context, signal)).rejects.toThrow(
      'ScopeDecompositionStep: unexpected stop_reason "max_tokens"',
    );
  });
});
