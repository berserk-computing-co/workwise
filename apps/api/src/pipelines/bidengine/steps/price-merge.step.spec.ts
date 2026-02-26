import { PriceMergeStep } from "./price-merge.step.js";
import { ItemSource } from "../bidengine.enums.js";
import type { BidEngineContext, PricedItem } from "../bidengine-context.js";

function makeOneBuildItem(
  description: string,
  sectionName: string,
  confidence: number,
  source: ItemSource = ItemSource.AiPriced,
  unitCost = 10,
): PricedItem {
  return {
    description,
    quantity: 1,
    unit: "EA",
    unitCost,
    source,
    sourceData: { confidence },
    sectionName,
  };
}

function makeWebItem(
  description: string,
  sectionName: string,
  confidence: number,
  unitCost = 12,
): PricedItem {
  return {
    description,
    quantity: 1,
    unit: "EA",
    unitCost,
    source: ItemSource.WebPriced,
    sourceData: { confidence },
    sectionName,
  };
}

function makeBaseContext(): BidEngineContext {
  return {
    projectId: "proj-1",
    description: "test",
    address: "123 Main",
    zipCode: "90210",
    category: "roofing",
  };
}

describe("PriceMergeStep", () => {
  let step: PriceMergeStep;

  beforeEach(() => {
    step = new PriceMergeStep();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('name equals "price_merge"', () => {
    expect(step.name).toBe("price_merge");
  });

  it("both sources present — higher confidence wins (oneBuild confidence 0.9, web 0.7 — oneBuild wins)", async () => {
    const context: BidEngineContext = {
      ...makeBaseContext(),
      oneBuildResults: [
        makeOneBuildItem("Shingles", "Roofing", 0.9, ItemSource.AiPriced, 10),
      ],
      webResults: [makeWebItem("Shingles", "Roofing", 0.7, 12)],
    };

    await step.execute(context);

    expect(context.pricedItems).toHaveLength(1);
    const merged = context.pricedItems![0];
    expect(merged.source).toBe(ItemSource.AiPriced);
    expect(merged.unitCost).toBe(10);
    expect(merged.sourceData?.alternateSource).toMatchObject({
      source: ItemSource.WebPriced,
      unitCost: 12,
      confidence: 0.7,
    });
  });

  it("both sources present — web wins when higher confidence (oneBuild 0.6, web 0.9)", async () => {
    const context: BidEngineContext = {
      ...makeBaseContext(),
      oneBuildResults: [
        makeOneBuildItem(
          "Underlayment",
          "Roofing",
          0.6,
          ItemSource.AiPriced,
          5,
        ),
      ],
      webResults: [makeWebItem("Underlayment", "Roofing", 0.9, 7)],
    };

    await step.execute(context);

    expect(context.pricedItems).toHaveLength(1);
    const merged = context.pricedItems![0];
    expect(merged.source).toBe(ItemSource.WebPriced);
    expect(merged.unitCost).toBe(7);
    expect(merged.sourceData?.alternateSource).toMatchObject({
      source: ItemSource.AiPriced,
      unitCost: 5,
      confidence: 0.6,
    });
  });

  it("equal confidence — oneBuild wins tie", async () => {
    const context: BidEngineContext = {
      ...makeBaseContext(),
      oneBuildResults: [
        makeOneBuildItem("Flashing", "Roofing", 0.8, ItemSource.AiPriced, 8),
      ],
      webResults: [makeWebItem("Flashing", "Roofing", 0.8, 9)],
    };

    await step.execute(context);

    expect(context.pricedItems).toHaveLength(1);
    const merged = context.pricedItems![0];
    expect(merged.source).toBe(ItemSource.AiPriced);
    expect(merged.unitCost).toBe(8);
  });

  it("only oneBuild present — uses oneBuild as-is", async () => {
    const oneBuildItems = [makeOneBuildItem("Shingles", "Roofing", 0.9)];
    const context: BidEngineContext = {
      ...makeBaseContext(),
      oneBuildResults: oneBuildItems,
    };

    await step.execute(context);

    expect(context.pricedItems).toBe(oneBuildItems);
  });

  it("only web present — uses web as-is", async () => {
    const webItems = [makeWebItem("Shingles", "Roofing", 0.8)];
    const context: BidEngineContext = {
      ...makeBaseContext(),
      webResults: webItems,
    };

    await step.execute(context);

    expect(context.pricedItems).toBe(webItems);
  });

  it("neither present — throws error", async () => {
    const context: BidEngineContext = { ...makeBaseContext() };

    await expect(step.execute(context)).rejects.toThrow(
      "Both pricing sources failed — cannot continue pipeline",
    );
  });

  it("oneBuild matched + web unmatched — uses oneBuild", async () => {
    const obItem = makeOneBuildItem(
      "Nails",
      "Roofing",
      0.85,
      ItemSource.AiPriced,
      3,
    );
    const webItem: PricedItem = {
      ...makeWebItem("Nails", "Roofing", 0),
      source: ItemSource.AiUnmatched,
    };
    const context: BidEngineContext = {
      ...makeBaseContext(),
      oneBuildResults: [obItem],
      webResults: [webItem],
    };

    await step.execute(context);

    expect(context.pricedItems).toHaveLength(1);
    expect(context.pricedItems![0].source).toBe(ItemSource.AiPriced);
    expect(context.pricedItems![0].unitCost).toBe(3);
  });

  it("oneBuild unmatched + web matched — uses web", async () => {
    const obItem = makeOneBuildItem(
      "Ridge Cap",
      "Roofing",
      0,
      ItemSource.AiUnmatched,
      15,
    );
    const webItem = makeWebItem("Ridge Cap", "Roofing", 0.75, 18);
    const context: BidEngineContext = {
      ...makeBaseContext(),
      oneBuildResults: [obItem],
      webResults: [webItem],
    };

    await step.execute(context);

    expect(context.pricedItems).toHaveLength(1);
    expect(context.pricedItems![0].source).toBe(ItemSource.WebPriced);
    expect(context.pricedItems![0].unitCost).toBe(18);
  });
});
