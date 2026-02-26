import { WebPricingAgentService } from "./web-pricing-agent.service.js";

const mockAgentResult = {
  text: JSON.stringify({
    results: [
      {
        index: 0,
        matched: true,
        retailer: "Home Depot",
        productUrl: "https://www.homedepot.com/p/example",
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
        category: "labor",
        skipReason: "labor_only",
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
  return new WebPricingAgentService(mockAgentRunner as any);
}

const mockItems = [
  {
    description: "2x4x8 lumber stud",
    quantity: 50,
    unit: "each",
    category: "material",
    sectionName: "Framing",
  },
  {
    description: "Install framing",
    quantity: 8,
    unit: "hours",
    category: "labor",
    sectionName: "Framing",
  },
];

describe("WebPricingAgentService", () => {
  let service: WebPricingAgentService;

  beforeEach(() => {
    service = makeService();
    jest.clearAllMocks();
    mockAgentRunner.run.mockResolvedValue(mockAgentResult);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("priceItems()", () => {
    it("calls agentRunner.run with web_pricing config", async () => {
      await service.priceItems(mockItems, "90210");

      expect(mockAgentRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "web_pricing",
          model: "claude-haiku-4-5-20251001",
          maxIterations: 20,
          maxTokens: 8192,
        }),
        expect.any(String),
      );
    });

    it("passes server tool with max_uses: 20", async () => {
      await service.priceItems(mockItems, "90210");

      const [config] = mockAgentRunner.run.mock.calls[0];
      expect(config.serverTools).toHaveLength(1);
      expect(config.serverTools[0]).toMatchObject({
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 20,
      });
    });

    it("passes empty tools array", async () => {
      await service.priceItems(mockItems, "90210");

      const [config] = mockAgentRunner.run.mock.calls[0];
      expect(config.tools).toEqual([]);
    });

    it("builds initial prompt with item count and ZIP code", async () => {
      await service.priceItems(mockItems, "90210");

      const [, initialPrompt] = mockAgentRunner.run.mock.calls[0];
      expect(initialPrompt).toContain("Price the following 2 items");
      expect(initialPrompt).toContain("ZIP code 90210");
    });

    it("includes item descriptions in the prompt", async () => {
      await service.priceItems(mockItems, "90210");

      const [, initialPrompt] = mockAgentRunner.run.mock.calls[0];
      expect(initialPrompt).toContain("2x4x8 lumber stud");
      expect(initialPrompt).toContain("Install framing");
    });

    it("returns parsed results array", async () => {
      const results = await service.priceItems(mockItems, "90210");

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
      const results = await service.priceItems(mockItems, "90210");

      expect(results[1]).toMatchObject({
        index: 1,
        matched: false,
        category: "labor",
        skipReason: "labor_only",
      });
    });

    it("returns empty array when agent returns no results", async () => {
      mockAgentRunner.run.mockResolvedValueOnce({
        text: JSON.stringify({ results: [] }),
        iterations: 1,
        toolCallCount: 1,
        truncated: false,
      });

      const results = await service.priceItems([], "90210");

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

      const results = await service.priceItems(mockItems, "90210");

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

      const results = await service.priceItems(mockItems, "90210");

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

      await expect(service.priceItems(mockItems, "90210")).rejects.toThrow(
        "API timeout",
      );
    });
  });
});
