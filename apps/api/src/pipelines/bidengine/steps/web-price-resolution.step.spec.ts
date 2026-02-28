import { WebPriceResolutionStep } from "./web-price-resolution.step.js";
import { ItemCategory, ItemSource } from "../bidengine.enums.js";
import type { BidEngineContext } from "../bidengine-context.js";

const mockWebPricingResults = [
  {
    index: 0,
    matched: true,
    retailer: "Home Depot",
    productUrl: "https://homedepot.com/p/12345",
    unitCost: 4.25,
    confidence: 0.85,
    category: "material",
    notes: "matched cedar decking",
  },
  {
    index: 1,
    matched: false,
    unitCost: 30.0,
    confidence: 0,
    category: "labor",
    skipReason: "no web match found",
  },
];

describe("WebPriceResolutionStep", () => {
  let mockWebPricingAgent: { priceItems: jest.Mock };
  let step: WebPriceResolutionStep;
  let context: BidEngineContext;

  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
    mockWebPricingAgent = {
      priceItems: jest.fn().mockResolvedValue(mockWebPricingResults),
    };
    step = new WebPriceResolutionStep(mockWebPricingAgent as any);
    context = {
      projectId: "proj-1",
      description: "test",
      address: "123 Main",
      zipCode: "90210",
      category: "decking",
      sections: [
        {
          name: "Decking",
          items: [
            {
              description: "cedar decking boards",
              quantity: 200,
              unit: "SF",
              category: ItemCategory.Material,
            },
            {
              description: "Decking labor",
              quantity: 20,
              unit: "HR",
              category: ItemCategory.Labor,
            },
          ],
        },
      ],
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('name equals "web_price_resolution"', () => {
    expect(step.name).toBe("web_price_resolution");
  });

  it("matched items get WebPriced source", async () => {
    await step.execute(context, signal);

    expect(context.webResults).toBeDefined();
    const matched = context.webResults![0];
    expect(matched.source).toBe(ItemSource.WebPriced);
    expect(matched.description).toBe("cedar decking boards");
    expect(matched.unitCost).toBe(4.25);
    expect(matched.sectionName).toBe("Decking");
    expect(matched.sourceData).toMatchObject({
      retailer: "Home Depot",
      productUrl: "https://homedepot.com/p/12345",
      confidence: 0.85,
    });
  });

  it("unmatched items get AiUnmatched source", async () => {
    await step.execute(context, signal);

    expect(context.webResults).toBeDefined();
    const unmatched = context.webResults![1];
    expect(unmatched.source).toBe(ItemSource.AiUnmatched);
    expect(unmatched.description).toBe("Decking labor");
    expect(unmatched.sectionName).toBe("Decking");
    expect(unmatched.sourceData).toMatchObject({
      skipReason: "no web match found",
      category: "labor",
    });
  });

  it("graceful degradation — sets empty array on agent failure", async () => {
    mockWebPricingAgent.priceItems.mockRejectedValue(
      new Error("network timeout"),
    );

    await expect(step.execute(context, signal)).resolves.toBeUndefined();
    expect(context.webResults).toEqual([]);
  });

  it("flattens sections and passes to agent", async () => {
    await step.execute(context, signal);

    expect(mockWebPricingAgent.priceItems).toHaveBeenCalledTimes(1);
    const [flatItems, zipCode] = mockWebPricingAgent.priceItems.mock.calls[0];
    expect(flatItems).toHaveLength(2);
    expect(flatItems[0]).toMatchObject({
      description: "cedar decking boards",
      sectionName: "Decking",
    });
    expect(flatItems[1]).toMatchObject({
      description: "Decking labor",
      sectionName: "Decking",
    });
    expect(zipCode).toBe("90210");
  });
});
