import type { AgentTool } from "../../ai/interfaces/agent.interfaces.js";
import type { OneBuildService } from "./onebuild.service.js";

export function createSearch1BuildTool(service: OneBuildService): AgentTool {
  return {
    definition: {
      name: "search_1build",
      description:
        "Search the 1Build construction pricing database for materials, assemblies, labor, and equipment. Returns up to 5 results with localized market pricing. All costs are in USD dollars. Use short generic terms (2-4 words) for best results. Omit source_type unless retrying with a narrower filter.",
      inputSchema: {
        type: "object",
        properties: {
          search_term: {
            type: "string",
            description:
              "Short generic search query, 2-4 words. Examples: 'drywall sheet', 'PEX pipe', '2x4 lumber', 'toilet'. Strip brand names, verbs, and extra dimensions.",
          },
          zip_code: {
            type: "string",
            description: "5-digit ZIP code for localized pricing.",
          },
          source_type: {
            type: "string",
            enum: [
              "MATERIAL",
              "ASSEMBLY",
              "LABOR",
              "EQUIPMENT",
              "SCOPE",
              "GENERAL_CONDITIONS",
            ],
            description:
              "Optional: filter results to a specific source type. Omit to search all types.",
          },
        },
        required: ["search_term", "zip_code"],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const results = await service.fetchSourceItems(
        input.search_term as string,
        input.zip_code as string,
        input.source_type as string | undefined,
      );
      return {
        query: input.search_term,
        result_count: results.length,
        results: results.slice(0, 5).map((r) => {
          const bestUom = r.knownUoms[0];
          return {
            id: r.id,
            name: r.name,
            source_type: r.sourceType ?? "MATERIAL",
            category_path: r.categoryPath ?? [],
            uom: bestUom?.uom ?? r.uom,
            material_rate: bestUom ? bestUom.materialRateUsdCents / 100 : 0,
            labor_rate: bestUom ? bestUom.laborRateUsdCents / 100 : 0,
            burdened_labor_rate: bestUom
              ? (bestUom.burdenedLaborRateUsdCents ?? 0) / 100
              : 0,
            all_in_rate: bestUom ? bestUom.calculatedUnitRateUsdCents / 100 : 0,
            production_rate: bestUom?.productionRate ?? null,
            known_uoms: r.knownUoms.map((k) => k.uom),
          };
        }),
      };
    },
  };
}
