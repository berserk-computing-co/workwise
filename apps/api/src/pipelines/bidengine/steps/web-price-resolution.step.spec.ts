import { WebPriceResolutionStep } from "./web-price-resolution.step.js";
import type { BidEngineContext, PricedItem } from "../bidengine-context.js";
import { ItemCategory, ItemSource } from "../bidengine.enums.js";

const mockPricedItems: PricedItem[] = [
  {
    description: "cedar decking boards",
    quantity: 200,
    unit: "SF",
    unitCost: 4.25,
    source: ItemSource.WebPriced,
    sectionName: "Decking",
    sourceUrl: "https://homedepot.com/p/12345",
    sourceData: {
      retailer: "Home Depot",
      confidence: 0.85,
    },
  },
  {
    description: "Decking labor",
    quantity: 20,
    unit: "HR",
    unitCost: 30.0,
    source: ItemSource.AiUnmatched,
    sectionName: "Decking",
    sourceData: {
      skipReason: "no web match found",
      category: "labor",
    },
  },
];

describe("WebPriceResolutionStep", () => {
  let mockPricingFanOut: { priceAll: jest.Mock };
  let step: WebPriceResolutionStep;
  let context: BidEngineContext;
  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
    mockPricingFanOut = {
      priceAll: jest.fn().mockResolvedValue(mockPricedItems),
    };
    step = new WebPriceResolutionStep(mockPricingFanOut as any);
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

  it("passes sections and zipCode to pricingFanOut.priceAll", async () => {
    await step.execute(context, signal);

    expect(mockPricingFanOut.priceAll).toHaveBeenCalledTimes(1);
    const [sections, zipCode, city, state, sig] =
      mockPricingFanOut.priceAll.mock.calls[0];
    expect(sections).toHaveLength(1);
    expect(sections[0].name).toBe("Decking");
    expect(zipCode).toBe("90210");
    expect(city).toBeNull();
    expect(state).toBeNull();
    expect(sig).toBe(signal);
  });

  it("writes priced items to context.pricedItems", async () => {
    await step.execute(context, signal);

    expect(context.pricedItems).toBeDefined();
    expect(context.pricedItems).toHaveLength(2);
    expect(context.pricedItems![0]).toMatchObject({
      description: "cedar decking boards",
      unitCost: 4.25,
      source: ItemSource.WebPriced,
      sectionName: "Decking",
    });
  });

  it("propagates errors from fan-out service", async () => {
    mockPricingFanOut.priceAll.mockRejectedValue(
      new Error("all batches failed"),
    );

    await expect(step.execute(context, signal)).rejects.toThrow(
      "all batches failed",
    );
  });
});
