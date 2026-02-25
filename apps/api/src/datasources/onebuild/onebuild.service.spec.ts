import { OneBuildService, SourceItem } from "./onebuild.service.js";

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue("test-key"),
  get: jest.fn().mockReturnValue("https://test.example.com/"),
};

const makeSourceItem = (overrides: Partial<SourceItem> = {}): SourceItem => ({
  id: "item-1",
  name: "Framing Lumber",
  uom: "Linear Feet",
  knownUoms: [
    {
      uom: "Linear Feet",
      materialRateUsdCents: 500,
      laborRateUsdCents: 200,
      burdenedLaborRateUsdCents: 250,
      productionRate: 1,
      calculatedUnitRateUsdCents: 700,
    },
  ],
  imagesUrls: [],
  ...overrides,
});

const makeOkResponse = (nodes: SourceItem[]): Partial<Response> => ({
  ok: true,
  json: jest.fn().mockResolvedValue({ data: { sources: { nodes } } }),
});

describe("OneBuildService", () => {
  let service: OneBuildService;

  beforeEach(() => {
    service = new OneBuildService(mockConfig as any);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetchSourceItems()", () => {
    it("calls fetch with the correct URL, headers, and body", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(makeOkResponse([]));

      await service.fetchSourceItems("lumber", "90210");

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("https://test.example.com/");
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers["1build-api-key"]).toBe("test-key");

      const body = JSON.parse(options.body as string);
      expect(body.variables.input.searchTerm).toBe("lumber");
      expect(body.variables.input.zipcode).toBe("90210");
      expect(body.variables.input.state).toBe("CA");
    });

    it("returns nodes from a valid response", async () => {
      const nodes = [makeSourceItem()];
      (global.fetch as jest.Mock).mockResolvedValue(makeOkResponse(nodes));

      const result = await service.fetchSourceItems("lumber", "90210");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("item-1");
    });

    it("returns [] on network error (fetch throws)", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("network error"));

      const result = await service.fetchSourceItems("lumber", "90210");

      expect(result).toEqual([]);
    });

    it("returns [] on non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const result = await service.fetchSourceItems("lumber", "90210");

      expect(result).toEqual([]);
    });

    it("returns [] on invalid JSON", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new SyntaxError("invalid JSON")),
      });

      const result = await service.fetchSourceItems("lumber", "90210");

      expect(result).toEqual([]);
    });
  });

  describe("batchLookup()", () => {
    it("returns matched results with unit_cost in dollars (cents / 100)", async () => {
      const node = makeSourceItem({
        knownUoms: [
          {
            uom: "Linear Feet",
            materialRateUsdCents: 500,
            laborRateUsdCents: 200,
            burdenedLaborRateUsdCents: 250,
            productionRate: 1,
            calculatedUnitRateUsdCents: 700,
          },
        ],
      });
      jest.spyOn(service, "fetchSourceItems").mockResolvedValue([node]);

      const results = await service.batchLookup(
        [{ description: "lumber", unit: "linear feet", quantity: 10 }],
        "90210",
      );

      expect(results).toHaveLength(1);
      expect(results[0].matched).toBe(true);
      expect(results[0].unit_cost).toBe(5); // 500 cents / 100
      expect(results[0].onebuild_id).toBe("item-1");
    });

    it("returns matched: false when no results", async () => {
      jest.spyOn(service, "fetchSourceItems").mockResolvedValue([]);

      const results = await service.batchLookup(
        [{ description: "unobtainium", unit: "each", quantity: 1 }],
        "90210",
      );

      expect(results).toHaveLength(1);
      expect(results[0].matched).toBe(false);
    });

    it("falls back to first knownUom when target UOM is not found", async () => {
      const node = makeSourceItem({
        knownUoms: [
          {
            uom: "Square Feet",
            materialRateUsdCents: 1000,
            laborRateUsdCents: 400,
            burdenedLaborRateUsdCents: 500,
            productionRate: 1,
            calculatedUnitRateUsdCents: 1400,
          },
        ],
      });
      jest.spyOn(service, "fetchSourceItems").mockResolvedValue([node]);

      // 'gallon' maps to 'Gallon', which does not match 'Square Feet'
      const results = await service.batchLookup(
        [{ description: "paint", unit: "gallon", quantity: 5 }],
        "90210",
      );

      expect(results[0].matched).toBe(true);
      // fell back to knownUoms[0] which has 1000 cents = $10
      expect(results[0].unit_cost).toBe(10);
      expect(results[0].uom).toBe("Square Feet");
    });
  });
});
