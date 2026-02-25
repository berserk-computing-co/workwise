import { createSearch1BuildTool } from "./onebuild.tool.js";
import type { OneBuildService, SourceItem } from "./onebuild.service.js";

const makeSourceItem = (
  id: string,
  overrides: Partial<SourceItem> = {},
): SourceItem => ({
  id,
  name: `Item ${id}`,
  uom: "Each",
  knownUoms: [
    {
      uom: "Each",
      materialRateUsdCents: 200,
      laborRateUsdCents: 100,
      burdenedLaborRateUsdCents: 120,
      productionRate: 1,
      calculatedUnitRateUsdCents: 300,
    },
  ],
  imagesUrls: [],
  ...overrides,
});

describe("createSearch1BuildTool", () => {
  let mockService: jest.Mocked<Pick<OneBuildService, "fetchSourceItems">>;
  let tool: ReturnType<typeof createSearch1BuildTool>;

  beforeEach(() => {
    mockService = {
      fetchSourceItems: jest.fn(),
    };
    tool = createSearch1BuildTool(mockService as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns an object with definition.name === 'search_1build'", () => {
    expect(tool.definition.name).toBe("search_1build");
  });

  it("execute() calls service.fetchSourceItems with search_term and zip_code", async () => {
    mockService.fetchSourceItems.mockResolvedValue([]);

    await tool.execute({ search_term: "lumber", zip_code: "90210" });

    expect(mockService.fetchSourceItems).toHaveBeenCalledWith(
      "lumber",
      "90210",
    );
  });

  it("execute() converts cents to dollars in results", async () => {
    mockService.fetchSourceItems.mockResolvedValue([makeSourceItem("item-1")]);

    const result = (await tool.execute({
      search_term: "lumber",
      zip_code: "90210",
    })) as any;

    expect(result.results[0].material_rate).toBe(2); // 200 cents / 100
    expect(result.results[0].labor_rate).toBe(1); // 100 cents / 100
    expect(result.results[0].all_in_rate).toBe(3); // 300 cents / 100
  });

  it("execute() limits results to 5 items", async () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      makeSourceItem(`item-${i}`),
    );
    mockService.fetchSourceItems.mockResolvedValue(items);

    const result = (await tool.execute({
      search_term: "lumber",
      zip_code: "90210",
    })) as any;

    expect(result.results).toHaveLength(5);
  });

  it("execute() handles an empty results array", async () => {
    mockService.fetchSourceItems.mockResolvedValue([]);

    const result = (await tool.execute({
      search_term: "nothing",
      zip_code: "90210",
    })) as any;

    expect(result.result_count).toBe(0);
    expect(result.results).toEqual([]);
  });
});
