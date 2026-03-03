import { MaterialPricingAgentService } from "./web-pricing-agent.service.js";

const mockAgentResult = {
  text: JSON.stringify({
    results: [
      {
        index: 0,
        matched: true,
        retailer: "Home Depot",
        sourceUrl: "https://www.homedepot.com/p/example",
        unitCost: 3.47,
        confidence: 0.85,
        notes: "Matched to 2x4x8 stud",
        category: "material",
      },
      {
        index: 1,
        matched: false,
        unitCost: 0,
        confidence: 0,
        category: "material",
        skipReason: "no_match",
      },
    ],
  }),
  iterations: 5,
  toolCallCount: 3,
  truncated: false,
};

const mockAgentRunner = {
  run: jest.fn().mockResolvedValue(mockAgentResult),
};

function makeService() {
  return new MaterialPricingAgentService(mockAgentRunner as any);
}

const mockItems = [
  {
    description: "2x4x8 lumber stud",
    quantity: 50,
    unit: "each",
    category: "material",
  },
  {
    description: "Drywall screws 1-5/8in",
    quantity: 10,
    unit: "box",
    category: "material",
  },
];

describe("MaterialPricingAgentService", () => {
  let service: MaterialPricingAgentService;
  let signal: AbortSignal;

  beforeEach(() => {
    service = makeService();
    signal = new AbortController().signal;
    jest.clearAllMocks();
    mockAgentRunner.run.mockResolvedValue(mockAgentResult);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("priceItems()", () => {
    it("calls agentRunner.run with material_pricing config", async () => {
      await service.priceItems(mockItems, "90210", "Los Angeles", "CA", "Framing", signal);

      expect(mockAgentRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "material_pricing",
          model: "claude-haiku-4-5-20251001",
          maxIterations: 40,
          maxTokens: 16384,
        }),
        expect.any(String),
        signal,
      );
    });

    it("passes server tools with web_search and web_fetch", async () => {
      await service.priceItems(mockItems, "90210", "Los Angeles", "CA", "Framing", signal);

      const [config] = mockAgentRunner.run.mock.calls[0];
      expect(config.serverTools).toHaveLength(2);
      expect(config.serverTools[0]).toMatchObject({
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 25,
      });
      expect(config.serverTools[1]).toMatchObject({
        type: "web_fetch_20250910",
        name: "web_fetch",
        max_uses: 10,
      });
    });

    it("passes empty tools array", async () => {
      await service.priceItems(mockItems, "90210", "Los Angeles", "CA", "Framing", signal);

      const [config] = mockAgentRunner.run.mock.calls[0];
      expect(config.tools).toEqual([]);
    });

    it("builds initial prompt with item count, section name, and location", async () => {
      await service.priceItems(mockItems, "90210", "Los Angeles", "CA", "Framing", signal);

      const [, initialPrompt] = mockAgentRunner.run.mock.calls[0];
      expect(initialPrompt).toContain("2 material items");
      expect(initialPrompt).toContain('"Framing"');
      expect(initialPrompt).toContain("Los Angeles, CA");
      expect(initialPrompt).toContain("ZIP 90210");
    });

    it("falls back to ZIP when city/state are null", async () => {
      await service.priceItems(mockItems, "90210", null, null, "Framing", signal);

      const [, initialPrompt] = mockAgentRunner.run.mock.calls[0];
      expect(initialPrompt).toContain("near ZIP 90210");
    });

    it("includes item descriptions in the prompt", async () => {
      await service.priceItems(mockItems, "90210", "Los Angeles", "CA", "Framing", signal);

      const [, initialPrompt] = mockAgentRunner.run.mock.calls[0];
      expect(initialPrompt).toContain("2x4x8 lumber stud");
      expect(initialPrompt).toContain("Drywall screws 1-5/8in");
    });

    it("returns parsed results array", async () => {
      const results = await service.priceItems(mockItems, "90210", "Los Angeles", "CA", "Framing", signal);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        index: 0,
        matched: true,
        retailer: "Home Depot",
        unitCost: 3.47,
        confidence: 0.85,
        category: "material",
      });
    });

    it("returns unmatched items with skipReason", async () => {
      const results = await service.priceItems(mockItems, "90210", "Los Angeles", "CA", "Framing", signal);

      expect(results[1]).toMatchObject({
        index: 1,
        matched: false,
        category: "material",
        skipReason: "no_match",
      });
    });

    it("returns empty array when agent returns no results", async () => {
      mockAgentRunner.run.mockResolvedValueOnce({
        text: JSON.stringify({ results: [] }),
        iterations: 1,
        toolCallCount: 1,
        truncated: false,
      });

      const results = await service.priceItems([], "90210", null, null, "Framing", signal);

      expect(results).toEqual([]);
    });

    it("rejects hallucinated results when agent made 0 tool calls", async () => {
      mockAgentRunner.run.mockResolvedValueOnce({
        text: JSON.stringify({
          results: [
            { index: 0, matched: true, unitCost: 99, confidence: 0.9, category: "material" },
          ],
        }),
        iterations: 0,
        toolCallCount: 0,
        truncated: false,
      });

      const results = await service.priceItems(mockItems, "90210", null, null, "Framing", signal);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        matched: false,
        unitCost: 0,
        skipReason: "agent_did_not_search",
      });
      expect(results[1]).toMatchObject({
        matched: false,
        unitCost: 0,
        skipReason: "agent_did_not_search",
      });
    });

    it("attempts JSON repair on truncated output", async () => {
      const truncatedJson = '{"results":[{"index":0,"matched":true,"unitCost":5.0,"confidence":0.8,"category":"material"},{"index":1,"matched":tr';
      mockAgentRunner.run.mockResolvedValueOnce({
        text: truncatedJson,
        iterations: 3,
        toolCallCount: 5,
        truncated: true,
      });

      const results = await service.priceItems(mockItems, "90210", null, null, "Framing", signal);

      // Should salvage the first complete result
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        index: 0,
        matched: true,
        unitCost: 5.0,
        category: "material",
      });
    });

    it("propagates agentRunner errors", async () => {
      mockAgentRunner.run.mockRejectedValueOnce(new Error("API timeout"));

      await expect(
        service.priceItems(mockItems, "90210", null, null, "Framing", signal),
      ).rejects.toThrow("API timeout");
    });
  });
});
