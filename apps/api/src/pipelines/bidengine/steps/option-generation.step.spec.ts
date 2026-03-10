import { OptionGenerationStep } from "./option-generation.step.js";
import { ItemSource, OptionTier } from "../bidengine.enums.js";
import type { BidEngineContext } from "../bidengine-context.js";

const validResponseText = JSON.stringify({
  options: [
    {
      tier: OptionTier.Good,
      label: "Basic",
      description: "Basic option",
      multiplier: 0.8,
      is_recommended: false,
      overrides: {},
    },
    {
      tier: OptionTier.Better,
      label: "Standard",
      description: "Standard option",
      multiplier: 1.0,
      is_recommended: true,
      overrides: {},
    },
    {
      tier: OptionTier.Best,
      label: "Premium",
      description: "Premium option",
      multiplier: 1.3,
      is_recommended: false,
      overrides: {},
    },
  ],
});

const mockChatResponse = {
  text: validResponseText,
  stopReason: "end_turn",
  toolCalls: [],
  usage: { inputTokens: 100, outputTokens: 200 },
  rawAssistantContent: [],
};

describe("OptionGenerationStep", () => {
  let mockProvider: { chat: jest.Mock };
  let step: OptionGenerationStep;
  let context: BidEngineContext;

  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
    mockProvider = { chat: jest.fn().mockResolvedValue(mockChatResponse) };
    step = new OptionGenerationStep(mockProvider as any);
    context = {
      projectId: "proj-1",
      description: "Replace kitchen plumbing",
      address: "123 Main St",
      zipCode: "90210",
      city: null,
      state: null,
      category: "plumbing",
      sections: [
        {
          name: "Rough-In",
          items: [
            {
              description: "PEX pipe",
              quantity: 50,
              unit: "LF",
              category: "material" as any,
            },
          ],
        },
      ],
      pricedItems: [
        {
          description: "PEX pipe",
          quantity: 50,
          unit: "LF",
          unitCost: 2.0,
          source: ItemSource.AiPriced,
          sectionName: "Rough-In",
        },
      ],
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('name equals "option_generation"', () => {
    expect(step.name).toBe("option_generation");
  });

  it('execute() calls provider.chat with model "claude-haiku-4-5-20251001" and maxTokens 4096', async () => {
    await step.execute(context, signal);

    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    const callArgs = mockProvider.chat.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-haiku-4-5-20251001");
    expect(callArgs.maxTokens).toBe(4096);
  });

  it("execute() populates context.options with multiplier and is_recommended → isRecommended mapping", async () => {
    await step.execute(context, signal);

    expect(context.options).toBeDefined();
    expect(context.options).toHaveLength(3);

    const good = context.options![0];
    expect(good.tier).toBe(OptionTier.Good);
    expect(good.label).toBe("Basic");
    expect(good.multiplier).toBe(0.8);
    expect(good.isRecommended).toBe(false);

    const better = context.options![1];
    expect(better.tier).toBe(OptionTier.Better);
    expect(better.label).toBe("Standard");
    expect(better.multiplier).toBe(1.0);
    expect(better.isRecommended).toBe(true);

    const best = context.options![2];
    expect(best.tier).toBe(OptionTier.Best);
    expect(best.label).toBe("Premium");
    expect(best.multiplier).toBe(1.3);
    expect(best.isRecommended).toBe(false);
  });

  it('execute() throws when stopReason !== "end_turn"', async () => {
    mockProvider.chat.mockResolvedValueOnce({
      ...mockChatResponse,
      stopReason: "max_tokens",
    });

    await expect(step.execute(context, signal)).rejects.toThrow(
      'OptionGenerationStep: unexpected stop_reason "max_tokens"',
    );
  });

  it("execute() fills missing tiers with defaults when AI returns fewer than 3", async () => {
    // AI returns only "better"
    const partialResponse = JSON.stringify({
      options: [
        {
          tier: OptionTier.Better,
          label: "Standard",
          description: "Standard option",
          multiplier: 1.0,
          is_recommended: true,
          overrides: {},
        },
      ],
    });

    mockProvider.chat.mockResolvedValueOnce({
      ...mockChatResponse,
      text: partialResponse,
    });

    await step.execute(context, signal);

    expect(context.options).toHaveLength(3);

    // Good filled with default
    const good = context.options![0];
    expect(good.tier).toBe(OptionTier.Good);
    expect(good.label).toBe("Budget");
    expect(good.multiplier).toBe(0.8);
    expect(good.isRecommended).toBe(false);

    // Better from AI
    const better = context.options![1];
    expect(better.tier).toBe(OptionTier.Better);
    expect(better.label).toBe("Standard");
    expect(better.multiplier).toBe(1.0);

    // Best filled with default
    const best = context.options![2];
    expect(best.tier).toBe(OptionTier.Best);
    expect(best.label).toBe("Premium");
    expect(best.multiplier).toBe(1.3);
    expect(best.isRecommended).toBe(false);
  });

  it("execute() deduplicates tiers and keeps the first occurrence", async () => {
    const dupeResponse = JSON.stringify({
      options: [
        {
          tier: OptionTier.Good,
          label: "Basic",
          description: "Basic option",
          multiplier: 0.8,
          is_recommended: false,
          overrides: {},
        },
        {
          tier: OptionTier.Good,
          label: "Also Basic",
          description: "Duplicate good",
          multiplier: 0.75,
          is_recommended: false,
          overrides: {},
        },
        {
          tier: OptionTier.Better,
          label: "Standard",
          description: "Standard option",
          multiplier: 1.0,
          is_recommended: true,
          overrides: {},
        },
        {
          tier: OptionTier.Best,
          label: "Premium",
          description: "Premium option",
          multiplier: 1.3,
          is_recommended: false,
          overrides: {},
        },
      ],
    });

    mockProvider.chat.mockResolvedValueOnce({
      ...mockChatResponse,
      text: dupeResponse,
    });

    await step.execute(context, signal);

    expect(context.options).toHaveLength(3);
    expect(context.options![0].label).toBe("Basic");
  });
});
