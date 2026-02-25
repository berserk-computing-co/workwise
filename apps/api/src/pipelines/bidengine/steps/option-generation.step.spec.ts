import { OptionGenerationStep } from "./option-generation.step.js";
import { ItemSource, OptionTier } from "../bidengine.enums.js";
import type { BidEngineContext } from "../bidengine-context.js";

const validResponseText = JSON.stringify({
  options: [
    {
      tier: OptionTier.Good,
      label: "Basic",
      description: "Basic option",
      total: 5000,
      is_recommended: false,
      overrides: {},
    },
    {
      tier: OptionTier.Better,
      label: "Standard",
      description: "Standard option",
      total: 7500,
      is_recommended: true,
      overrides: {},
    },
    {
      tier: OptionTier.Best,
      label: "Premium",
      description: "Premium option",
      total: 10000,
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

  beforeEach(() => {
    mockProvider = { chat: jest.fn().mockResolvedValue(mockChatResponse) };
    step = new OptionGenerationStep(mockProvider as any);
    context = {
      projectId: "proj-1",
      description: "Replace kitchen plumbing",
      address: "123 Main St",
      zipCode: "90210",
      category: "plumbing",
      sections: [
        {
          name: "Rough-In",
          items: [
            {
              description: "PEX pipe",
              quantity: 50,
              unit: "LF",
              unitCost: 2.0,
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

  it('execute() calls provider.chat with model "claude-sonnet-4-6" and maxTokens 4096', async () => {
    await step.execute(context);

    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    const callArgs = mockProvider.chat.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-6");
    expect(callArgs.maxTokens).toBe(4096);
  });

  it("execute() populates context.options with is_recommended → isRecommended mapping", async () => {
    await step.execute(context);

    expect(context.options).toBeDefined();
    expect(context.options).toHaveLength(3);

    const good = context.options![0];
    expect(good.tier).toBe(OptionTier.Good);
    expect(good.label).toBe("Basic");
    expect(good.isRecommended).toBe(false);

    const better = context.options![1];
    expect(better.tier).toBe(OptionTier.Better);
    expect(better.label).toBe("Standard");
    expect(better.isRecommended).toBe(true);

    const best = context.options![2];
    expect(best.tier).toBe(OptionTier.Best);
    expect(best.label).toBe("Premium");
    expect(best.isRecommended).toBe(false);
  });

  it('execute() throws when stopReason !== "end_turn"', async () => {
    mockProvider.chat.mockResolvedValueOnce({
      ...mockChatResponse,
      stopReason: "max_tokens",
    });

    await expect(step.execute(context)).rejects.toThrow(
      'OptionGenerationStep: unexpected stop_reason "max_tokens"',
    );
  });
});
