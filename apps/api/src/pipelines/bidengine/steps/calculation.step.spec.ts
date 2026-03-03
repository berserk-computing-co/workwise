import { CalculationStep } from "./calculation.step.js";
import { ItemSource, OptionTier } from "../bidengine.enums.js";
import type { BidEngineContext } from "../bidengine-context.js";
import { Section } from "../../../projects/entities/section.entity.js";
import { Item } from "../../../projects/entities/item.entity.js";
import { Option } from "../../../projects/entities/option.entity.js";
import { Project } from "../../../projects/entities/project.entity.js";

describe("CalculationStep", () => {
  let mockManager: {
    delete: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let mockDataSource: { transaction: jest.Mock };
  let step: CalculationStep;
  let context: BidEngineContext;

  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
    mockManager = {
      delete: jest.fn().mockResolvedValue(undefined),
      save: jest
        .fn()
        .mockImplementation((_entity, data) =>
          Promise.resolve({ id: "mock-id", ...data }),
        ),
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
    };
    step = new CalculationStep(mockDataSource as any);
    context = {
      projectId: "proj-1",
      description: "test project",
      address: "123 Main St",
      zipCode: "90210",
      category: "plumbing",
      sections: [
        {
          name: "Framing",
          items: [
            {
              description: "2x4 lumber",
              quantity: 100,
              unit: "LF",
              category: "material" as any,
            },
            {
              description: "Framing labor",
              quantity: 16,
              unit: "HR",
              category: "labor" as any,
            },
          ],
        },
      ],
      pricedItems: [
        {
          description: "2x4 lumber",
          quantity: 100,
          unit: "LF",
          unitCost: 3.5,
          source: ItemSource.AiPriced,
          sourceData: { retailer: "Home Depot", confidence: 0.85 },
          sectionName: "Framing",
        },
        {
          description: "Framing labor",
          quantity: 16,
          unit: "HR",
          unitCost: 25.0,
          source: ItemSource.AiUnmatched,
          sourceData: { skipReason: "no match" },
          sectionName: "Framing",
        },
      ],
      options: [
        {
          tier: OptionTier.Good,
          label: "Basic",
          description: "Basic option",
          multiplier: 0.8,
          isRecommended: false,
          overrides: {},
        },
        {
          tier: OptionTier.Better,
          label: "Standard",
          description: "Standard option",
          multiplier: 1.0,
          isRecommended: true,
          overrides: {},
        },
        {
          tier: OptionTier.Best,
          label: "Premium",
          description: "Premium option",
          multiplier: 1.3,
          isRecommended: false,
          overrides: {},
        },
      ],
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('name equals "calculation"', () => {
    expect(step.name).toBe("calculation");
  });

  it("execute() computes total from pricedItems: sum(quantity * unitCost)", async () => {
    await step.execute(context, signal);

    // 100 * 3.50 + 16 * 25.00 = 350 + 400 = 750
    expect(context.totals).toBeDefined();
    expect(context.totals!.total).toBe(750);
  });

  it("execute() runs transaction: deletes old sections + options, saves new ones", async () => {
    await step.execute(context, signal);

    expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    expect(mockManager.delete).toHaveBeenCalledWith(Section, {
      projectId: "proj-1",
    });
    expect(mockManager.delete).toHaveBeenCalledWith(Option, {
      projectId: "proj-1",
    });
    expect(mockManager.save).toHaveBeenCalled();
  });

  it("execute() saves sections with correct sortOrder and rounded subtotal", async () => {
    await step.execute(context, signal);

    const sectionSaveCall = mockManager.save.mock.calls.find(
      ([entity]) => entity === Section,
    );
    expect(sectionSaveCall).toBeDefined();
    const sectionData = sectionSaveCall![1];
    expect(sectionData.name).toBe("Framing");
    expect(sectionData.sortOrder).toBe(0);
    // subtotal = 100 * 3.50 + 16 * 25.00 = 750.00
    expect(sectionData.subtotal).toBe(750);
    expect(sectionData.projectId).toBe("proj-1");
  });

  it("execute() saves items with extendedCost = round(quantity * unitCost, 2)", async () => {
    await step.execute(context, signal);

    const itemSaveCalls = mockManager.save.mock.calls.filter(
      ([entity]) => entity === Item,
    );
    expect(itemSaveCalls).toHaveLength(2);

    const lumberItemData = itemSaveCalls[0][1];
    expect(lumberItemData.description).toBe("2x4 lumber");
    expect(lumberItemData.extendedCost).toBe(350);
    expect(lumberItemData.sortOrder).toBe(0);

    const laborItemData = itemSaveCalls[1][1];
    expect(laborItemData.description).toBe("Framing labor");
    expect(laborItemData.extendedCost).toBe(400);
    expect(laborItemData.sortOrder).toBe(1);
  });

  it("execute() saves options with total = base_total * multiplier", async () => {
    await step.execute(context, signal);

    const optionSaveCalls = mockManager.save.mock.calls.filter(
      ([entity]) => entity === Option,
    );
    expect(optionSaveCalls).toHaveLength(3);

    // base total = 750
    const [, goodData] = optionSaveCalls[0];
    expect(goodData.tier).toBe(OptionTier.Good);
    expect(goodData.label).toBe("Basic");
    expect(goodData.total).toBe(600); // 750 * 0.8
    expect(goodData.multiplier).toBe(0.8);
    expect(goodData.isRecommended).toBe(false);
    expect(goodData.projectId).toBe("proj-1");

    const [, betterData] = optionSaveCalls[1];
    expect(betterData.tier).toBe(OptionTier.Better);
    expect(betterData.total).toBe(750); // 750 * 1.0
    expect(betterData.multiplier).toBe(1.0);
    expect(betterData.isRecommended).toBe(true);

    const [, bestData] = optionSaveCalls[2];
    expect(bestData.tier).toBe(OptionTier.Best);
    expect(bestData.total).toBe(975); // 750 * 1.3
    expect(bestData.multiplier).toBe(1.3);
    expect(bestData.isRecommended).toBe(false);
  });

  it('execute() updates project status to "generated" with rounded total', async () => {
    await step.execute(context, signal);

    expect(mockManager.update).toHaveBeenCalledWith(Project, "proj-1", {
      status: "generated",
      total: 750,
    });
  });

  it("execute() populates context.totals", async () => {
    await step.execute(context, signal);

    expect(context.totals).toBeDefined();
    expect(context.totals).toEqual({ total: 750 });
  });
});
