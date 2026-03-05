import { PricingFanOutService } from './pricing-fan-out.service.js';
import type { ScopeSection } from '../bidengine-context.js';
import { ItemCategory, ItemSource } from '../bidengine.enums.js';
import type { PricingResult } from './web-pricing-agent.service.js';

function makeMaterialResult(
  index: number,
  matched: boolean,
  unitCost: number,
): PricingResult {
  return {
    index,
    matched,
    unitCost,
    confidence: 0.9,
    category: 'material',
    retailer: matched ? 'Home Depot' : undefined,
    sourceUrl: matched ? 'https://homedepot.com/p/1' : undefined,
  };
}

function makeLaborResult(
  index: number,
  matched: boolean,
  unitCost: number,
): PricingResult {
  return {
    index,
    matched,
    unitCost,
    confidence: 0.8,
    category: 'labor',
  };
}

function makeSection(
  name: string,
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    category: ItemCategory;
  }>,
): ScopeSection {
  return { name, items };
}

describe('PricingFanOutService', () => {
  let mockMaterialAgent: { priceItems: jest.Mock };
  let mockLaborAgent: { priceItems: jest.Mock };
  let service: PricingFanOutService;
  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
    mockMaterialAgent = {
      priceItems: jest.fn().mockResolvedValue([]),
    };
    mockLaborAgent = {
      priceItems: jest.fn().mockResolvedValue([]),
    };
    service = new PricingFanOutService(
      mockMaterialAgent as any,
      mockLaborAgent as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('splits items by category — material to materialAgent, labor to laborAgent', async () => {
    mockMaterialAgent.priceItems.mockResolvedValue([
      makeMaterialResult(0, true, 10),
    ]);
    mockLaborAgent.priceItems.mockResolvedValue([makeLaborResult(0, false, 0)]);

    const sections = [
      makeSection('Framing', [
        {
          description: '2x4 lumber',
          quantity: 50,
          unit: 'EA',
          category: ItemCategory.Material,
        },
        {
          description: 'Framing labor',
          quantity: 8,
          unit: 'HR',
          category: ItemCategory.Labor,
        },
      ]),
    ];

    await service.priceAll(sections, '90210', 'LA', 'CA', signal);

    expect(mockMaterialAgent.priceItems).toHaveBeenCalledTimes(1);
    expect(mockLaborAgent.priceItems).toHaveBeenCalledTimes(1);

    const materialCall = mockMaterialAgent.priceItems.mock.calls[0];
    expect(materialCall[0]).toHaveLength(1);
    expect(materialCall[0][0].description).toBe('2x4 lumber');

    const laborCall = mockLaborAgent.priceItems.mock.calls[0];
    expect(laborCall[0]).toHaveLength(1);
    expect(laborCall[0][0].description).toBe('Framing labor');
  });

  it('chunks material items at MATERIAL_BATCH_SIZE=12 — 25 items yields 3 calls', async () => {
    mockMaterialAgent.priceItems.mockResolvedValue([]);

    const items = Array.from({ length: 25 }, (_, i) => ({
      description: `material-${i}`,
      quantity: 1,
      unit: 'EA',
      category: ItemCategory.Material,
    }));

    await service.priceAll(
      [makeSection('Big Section', items)],
      '10001',
      null,
      null,
      signal,
    );

    expect(mockMaterialAgent.priceItems).toHaveBeenCalledTimes(3);
    expect(mockMaterialAgent.priceItems.mock.calls[0][0]).toHaveLength(12);
    expect(mockMaterialAgent.priceItems.mock.calls[1][0]).toHaveLength(12);
    expect(mockMaterialAgent.priceItems.mock.calls[2][0]).toHaveLength(1);
    expect(mockLaborAgent.priceItems).not.toHaveBeenCalled();
  });

  it('handles section with only material items — laborAgent never called', async () => {
    mockMaterialAgent.priceItems.mockResolvedValue([
      makeMaterialResult(0, true, 5.5),
    ]);

    const sections = [
      makeSection('Materials Only', [
        {
          description: 'PVC pipe',
          quantity: 10,
          unit: 'LF',
          category: ItemCategory.Material,
        },
      ]),
    ];

    await service.priceAll(sections, '30301', 'Atlanta', 'GA', signal);

    expect(mockMaterialAgent.priceItems).toHaveBeenCalledTimes(1);
    expect(mockLaborAgent.priceItems).not.toHaveBeenCalled();
  });

  it('handles section with only labor/equipment/permit items — materialAgent never called', async () => {
    mockLaborAgent.priceItems.mockResolvedValue([
      makeLaborResult(0, false, 0),
      makeLaborResult(1, false, 0),
      makeLaborResult(2, false, 0),
    ]);

    const sections = [
      makeSection('Non-Material', [
        {
          description: 'Electrician',
          quantity: 4,
          unit: 'HR',
          category: ItemCategory.Labor,
        },
        {
          description: 'Equipment rental',
          quantity: 1,
          unit: 'DAY',
          category: ItemCategory.Equipment,
        },
        {
          description: 'Permit fee',
          quantity: 1,
          unit: 'EA',
          category: ItemCategory.Permit,
        },
      ]),
    ];

    await service.priceAll(sections, '77001', 'Houston', 'TX', signal);

    expect(mockMaterialAgent.priceItems).not.toHaveBeenCalled();
    expect(mockLaborAgent.priceItems).toHaveBeenCalledTimes(1);
  });

  it('multiple sections — each PricedItem.sectionName matches its source section', async () => {
    mockMaterialAgent.priceItems
      .mockResolvedValueOnce([makeMaterialResult(0, true, 3.0)])
      .mockResolvedValueOnce([makeMaterialResult(0, true, 7.5)]);
    mockLaborAgent.priceItems
      .mockResolvedValueOnce([makeLaborResult(0, false, 0)])
      .mockResolvedValueOnce([makeLaborResult(0, false, 0)]);

    const sections = [
      makeSection('Decking', [
        {
          description: 'deck boards',
          quantity: 100,
          unit: 'SF',
          category: ItemCategory.Material,
        },
        {
          description: 'deck labor',
          quantity: 10,
          unit: 'HR',
          category: ItemCategory.Labor,
        },
      ]),
      makeSection('Railing', [
        {
          description: 'railing post',
          quantity: 20,
          unit: 'EA',
          category: ItemCategory.Material,
        },
        {
          description: 'railing labor',
          quantity: 6,
          unit: 'HR',
          category: ItemCategory.Labor,
        },
      ]),
    ];

    const result = await service.priceAll(
      sections,
      '98101',
      'Seattle',
      'WA',
      signal,
    );

    expect(result).toHaveLength(4);
    expect(result[0].sectionName).toBe('Decking');
    expect(result[1].sectionName).toBe('Decking');
    expect(result[2].sectionName).toBe('Railing');
    expect(result[3].sectionName).toBe('Railing');
  });

  it('Promise.allSettled failure recovery — failed batch yields AiUnmatched with unitCost 0, others succeed', async () => {
    mockMaterialAgent.priceItems
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce([makeMaterialResult(0, true, 20.0)]);
    mockLaborAgent.priceItems.mockResolvedValue([makeLaborResult(0, false, 0)]);

    const sections = [
      makeSection('Section A', [
        {
          description: 'failing material',
          quantity: 1,
          unit: 'EA',
          category: ItemCategory.Material,
        },
        {
          description: 'labor item',
          quantity: 2,
          unit: 'HR',
          category: ItemCategory.Labor,
        },
      ]),
      makeSection('Section B', [
        {
          description: 'succeeding material',
          quantity: 1,
          unit: 'LF',
          category: ItemCategory.Material,
        },
      ]),
    ];

    const result = await service.priceAll(
      sections,
      '60601',
      'Chicago',
      'IL',
      signal,
    );

    expect(result).toHaveLength(3);

    // First item — failed material batch
    expect(result[0].source).toBe(ItemSource.AiUnmatched);
    expect(result[0].unitCost).toBe(0);
    expect(result[0].description).toBe('failing material');

    // Second item — labor batch succeeded
    expect(result[1].source).toBe(ItemSource.AiUnmatched);
    expect(result[1].description).toBe('labor item');

    // Third item — second material batch succeeded
    expect(result[2].source).toBe(ItemSource.WebPriced);
    expect(result[2].unitCost).toBe(20.0);
  });

  it('propagates AbortSignal to all agent priceItems calls', async () => {
    const controller = new AbortController();
    const testSignal = controller.signal;

    mockMaterialAgent.priceItems.mockResolvedValue([
      makeMaterialResult(0, true, 1),
    ]);
    mockLaborAgent.priceItems.mockResolvedValue([makeLaborResult(0, false, 0)]);

    const sections = [
      makeSection('Test', [
        {
          description: 'mat item',
          quantity: 1,
          unit: 'EA',
          category: ItemCategory.Material,
        },
        {
          description: 'lab item',
          quantity: 1,
          unit: 'HR',
          category: ItemCategory.Labor,
        },
      ]),
    ];

    await service.priceAll(sections, '10001', 'New York', 'NY', testSignal);

    const materialCallArgs = mockMaterialAgent.priceItems.mock.calls[0];
    expect(materialCallArgs[5]).toBe(testSignal);

    const laborCallArgs = mockLaborAgent.priceItems.mock.calls[0];
    expect(laborCallArgs[5]).toBe(testSignal);
  });

  it('empty section — no agent calls, returns empty array', async () => {
    const sections = [makeSection('Empty', [])];

    const result = await service.priceAll(
      sections,
      '90001',
      null,
      null,
      signal,
    );

    expect(result).toHaveLength(0);
    expect(mockMaterialAgent.priceItems).not.toHaveBeenCalled();
    expect(mockLaborAgent.priceItems).not.toHaveBeenCalled();
  });

  it('matched items get ItemSource.WebPriced, unmatched get ItemSource.AiUnmatched', async () => {
    mockMaterialAgent.priceItems.mockResolvedValue([
      makeMaterialResult(0, true, 12.5),
      makeMaterialResult(1, false, 0),
    ]);

    const sections = [
      makeSection('Mixed Results', [
        {
          description: 'known item',
          quantity: 2,
          unit: 'EA',
          category: ItemCategory.Material,
        },
        {
          description: 'unknown item',
          quantity: 1,
          unit: 'SF',
          category: ItemCategory.Material,
        },
      ]),
    ];

    const result = await service.priceAll(
      sections,
      '85001',
      'Phoenix',
      'AZ',
      signal,
    );

    expect(result[0].source).toBe(ItemSource.WebPriced);
    expect(result[0].unitCost).toBe(12.5);
    expect(result[0].sourceUrl).toBe('https://homedepot.com/p/1');
    expect(result[0].sourceData).toMatchObject({
      retailer: 'Home Depot',
      confidence: 0.9,
    });

    expect(result[1].source).toBe(ItemSource.AiUnmatched);
    expect(result[1].unitCost).toBe(0);
    expect(result[1].sourceUrl).toBeUndefined();
  });

  it('sectionName is passed as parameter to agent priceItems calls', async () => {
    mockMaterialAgent.priceItems.mockResolvedValue([
      makeMaterialResult(0, true, 5),
    ]);

    const sections = [
      makeSection('Specific Section Name', [
        {
          description: 'item',
          quantity: 1,
          unit: 'EA',
          category: ItemCategory.Material,
        },
      ]),
    ];

    await service.priceAll(sections, '10001', 'New York', 'NY', signal);

    const callArgs = mockMaterialAgent.priceItems.mock.calls[0];
    // signature: (items, zipCode, city, state, sectionName, signal)
    expect(callArgs[4]).toBe('Specific Section Name');
  });

  it('items not covered by agent results are filled as AiUnmatched with unitCost 0', async () => {
    // Agent returns only 1 result but there are 2 items in the batch
    mockMaterialAgent.priceItems.mockResolvedValue([
      makeMaterialResult(0, true, 8.0),
      // index 1 is missing — agent skipped it
    ]);

    const sections = [
      makeSection('Partial Coverage', [
        {
          description: 'covered item',
          quantity: 1,
          unit: 'EA',
          category: ItemCategory.Material,
        },
        {
          description: 'uncovered item',
          quantity: 1,
          unit: 'EA',
          category: ItemCategory.Material,
        },
      ]),
    ];

    const result = await service.priceAll(
      sections,
      '77001',
      null,
      null,
      signal,
    );

    expect(result[0].source).toBe(ItemSource.WebPriced);
    expect(result[0].unitCost).toBe(8.0);

    expect(result[1].source).toBe(ItemSource.AiUnmatched);
    expect(result[1].unitCost).toBe(0);
    expect(result[1].description).toBe('uncovered item');
  });
});
