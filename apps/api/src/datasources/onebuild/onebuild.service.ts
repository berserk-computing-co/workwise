import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mapUnitToOneBuildUom, zipToState } from "./uom-mapping.js";

const QUERY = `
  query sources($input: SourceSearchInput!) {
  sources(input: $input) {
    nodes {
      id
      name
      uom
      sourceType
      categoryPath
      knownUoms {
        uom
        materialRateUsdCents
        laborRateUsdCents
        burdenedLaborRateUsdCents
        productionRate
        calculatedUnitRateUsdCents
      }
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

export interface SourceItemFields {
  uom: string;
  calculatedUnitRateUsdCents: number;
  laborRateUsdCents: number;
  materialRateUsdCents: number;
  burdenedLaborRateUsdCents?: number;
  productionRate?: number;
}

export interface SourceItem {
  id: string;
  name: string;
  uom: string;
  knownUoms: SourceItemFields[];
  sourceType?: string;
  categoryPath?: string[];
}

export interface BatchLookupResult {
  index: number;
  matched: boolean;
  onebuild_id?: string;
  unit_cost?: number;
  match_score?: number;
  uom?: string;
}

@Injectable()
export class OneBuildService {
  private readonly logger = new Logger(OneBuildService.name);
  private readonly apiKey: string;
  private readonly endpoint: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>("ONEBUILD_API_KEY");
    this.endpoint = this.config.get<string>(
      "ONEBUILD_ENDPOINT",
      "https://gateway-external.1build.com/",
    );
  }

  async fetchSourceItems(
    searchTerm: string,
    zipCode: string,
    sourceType?: string,
  ): Promise<SourceItem[]> {
    const state = zipToState(zipCode);
    const input: Record<string, unknown> = {
      state,
      zipcode: zipCode,
      searchTerm,
      page: { limit: 6 },
      sortBy: { type: "MATCH_SCORE" },
    };
    if (sourceType) {
      input.sourceType = sourceType;
    }
    const variables = { input };

    this.logger.debug(
      `fetchSourceItems: term="${searchTerm}" state=${state} zip=${zipCode} sourceType=${sourceType ?? "ALL"}`,
    );

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "1build-api-key": this.apiKey,
        },
        body: JSON.stringify({ query: QUERY, variables }),
      });
    } catch (err) {
      this.logger.error(
        `fetchSourceItems network error for "${searchTerm}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }

    if (!response.ok) {
      this.logger.warn(
        `fetchSourceItems HTTP ${response.status} for "${searchTerm}": ${response.statusText}`,
      );
      return [];
    }

    let json: { data?: { sources?: { nodes?: SourceItem[] } }; errors?: unknown[] };
    try {
      json = (await response.json()) as typeof json;
    } catch (err) {
      this.logger.error(
        `fetchSourceItems JSON parse error for "${searchTerm}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }

    if (json.errors) {
      this.logger.warn(
        `fetchSourceItems GraphQL errors for "${searchTerm}": ${JSON.stringify(json.errors)}`,
      );
    }

    const nodes = json?.data?.sources?.nodes ?? [];
    this.logger.debug(
      `fetchSourceItems: "${searchTerm}" → ${nodes.length} results`,
    );
    return nodes;
  }

  async batchLookup(
    items: { description: string; unit: string; quantity: number }[],
    zipCode: string,
  ): Promise<BatchLookupResult[]> {
    const results: BatchLookupResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const nodes = await this.fetchSourceItems(
        item.description,
        zipCode,
      );

      if (nodes.length === 0) {
        results.push({ index: i, matched: false });
        continue;
      }

      const targetUom = mapUnitToOneBuildUom(item.unit);
      const topNode = nodes[0];

      let matchedUomField: SourceItemFields | undefined;
      if (targetUom) {
        matchedUomField = topNode.knownUoms.find((k) => k.uom === targetUom);
      }
      if (!matchedUomField) {
        matchedUomField = topNode.knownUoms[0];
      }

      if (!matchedUomField) {
        results.push({ index: i, matched: false });
        continue;
      }

      results.push({
        index: i,
        matched: true,
        onebuild_id: topNode.id,
        unit_cost: matchedUomField.materialRateUsdCents / 100,
        uom: matchedUomField.uom,
      });
    }

    return results;
  }
}
