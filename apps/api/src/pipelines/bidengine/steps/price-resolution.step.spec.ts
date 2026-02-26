import { PriceResolutionStep } from "./price-resolution.step.js";
import { ItemCategory, ItemSource } from "../bidengine.enums.js";
import type { BidEngineContext } from "../bidengine-context.js";

const mockPricingResults = [
  {
    index: 0,
    matched: true,
    onebuildId: "ob-1",
    onebuildName: "2x4 Lumber",
    materialUnitCost: 2.5,
    laborUnitCost: 1.0,
    unitCost: 3.5,
    laborSource: "1build",
    confidence: 0.9,
    category: "material",
    notes: "",
  },
  {
    index: 1,
    matched: false,
    materialUnitCost: 0,
    laborUnitCost: 0,
    unitCost: 25.0,
    laborSource: "ai_estimate",
    confidence: 0,
    category: "labor",
    skipReason: "no match found",
  },
];

describe("PriceResolutionStep", () => {
  let mockOneBuildAgent: { priceItems: jest.Mock };
  let step: PriceResolutionStep;
  let context: BidEngineContext;

  beforeEach(() => {
    mockOneBuildAgent = {
      priceItems: jest.fn().mockResolvedValue(mockPricingResults),
    };
    step = new PriceResolutionStep(mockOneBuildAgent as any);
    context = {
      projectId: "proj-1",
      description: "test",
      address: "123 Main",
      zipCode: "90210",
      category: "kitchen",
      sections: [
        {
          name: "Framing",
          items: [
            {
              description: "2x4 lumber",
              quantity: 100,
              unit: "LF",
              category: ItemCategory.Material,
            },
            {
              description: "Framing labor",
              quantity: 16,
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

  it('name equals "price_resolution"', () => {
    expect(step.name).toBe("price_resolution");
  });

  it("execute() flattens sections into flat items with sectionName", async () => {
    await step.execute(context);

    expect(mockOneBuildAgent.priceItems).toHaveBeenCalledTimes(1);
    const [flatItems] = mockOneBuildAgent.priceItems.mock.calls[0];
    expect(flatItems).toHaveLength(2);
    expect(flatItems[0]).toMatchObject({
      description: "2x4 lumber",
      sectionName: "Framing",
    });
    expect(flatItems[1]).toMatchObject({
      description: "Framing labor",
      sectionName: "Framing",
    });
  });

  it("execute() calls oneBuildAgent.priceItems with flat items and zipCode", async () => {
    await step.execute(context);

    expect(mockOneBuildAgent.priceItems).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ description: "2x4 lumber" }),
        expect.objectContaining({ description: "Framing labor" }),
      ]),
      "90210",
    );
  });

  it("execute() maps matched result → PricedItem with source AiPriced", async () => {
    await step.execute(context);

    expect(context.oneBuildResults).toBeDefined();
    const matched = context.oneBuildResults![0];
    expect(matched.source).toBe(ItemSource.AiPriced);
    expect(matched.description).toBe("2x4 lumber");
    expect(matched.unitCost).toBe(3.5);
    expect(matched.sectionName).toBe("Framing");
    expect(matched.sourceData).toMatchObject({
      onebuildId: "ob-1",
      onebuildName: "2x4 Lumber",
      materialUnitCost: 2.5,
      laborUnitCost: 1.0,
      laborSource: "1build",
      confidence: 0.9,
      category: "material",
      notes: "",
    });
  });

  it("execute() maps unmatched result → PricedItem with source AiUnmatched", async () => {
    await step.execute(context);

    expect(context.oneBuildResults).toBeDefined();
    const unmatched = context.oneBuildResults![1];
    expect(unmatched.source).toBe(ItemSource.AiUnmatched);
    expect(unmatched.description).toBe("Framing labor");
    expect(unmatched.sectionName).toBe("Framing");
    expect(unmatched.sourceData).toMatchObject({
      skipReason: "no match found",
    });
  });

  it("graceful degradation — sets empty array on agent failure", async () => {
    mockOneBuildAgent.priceItems.mockRejectedValueOnce(
      new Error("API timeout"),
    );

    await step.execute(context);

    expect(context.oneBuildResults).toEqual([]);
  });
});
