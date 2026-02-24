import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mapUnitToOneBuildUom, zipToState } from './uom-mapping.js';

const QUERY = `
  query sources($input: SourceSearchInput!) {
  sources(input: $input) {
    nodes {
      id
      name
      county
      imagesUrls
      uom
      externalProductUrl
      knownUoms {
        uom
        materialRateUsdCents
        laborRateUsdCents
        calculatedUnitRateUsdCents
      }
    }
  }
}
`.replace(/\s+/g, ' ').trim();

export interface SourceItemFields {
  uom: string;
  calculatedUnitRateUsdCents: number;
  laborRateUsdCents: number;
  materialRateUsdCents: number;
}

export interface SourceItem {
  id: string;
  name: string;
  uom: string;
  knownUoms: SourceItemFields[];
  imagesUrls: string[];
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
  private readonly apiKey: string;
  private readonly endpoint: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('ONEBUILD_API_KEY');
    this.endpoint = this.config.get<string>('ONEBUILD_ENDPOINT', 'https://gateway-external.1build.com/');
  }

  async fetchSourceItems(searchTerm: string, zipCode: string, uom?: string): Promise<SourceItem[]> {
    const state = zipToState(zipCode);
    const variables = {
      input: {
        state,
        zipcode: zipCode,
        searchTerm,
        page: { limit: 6 },
        sortBy: { type: 'MATCH_SCORE' },
      },
    };

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '1build-api-key': this.apiKey,
        },
        body: JSON.stringify({ query: QUERY, variables }),
      });
    } catch {
      return [];
    }

    if (!response.ok) {
      return [];
    }

    let json: { data?: { sources?: { nodes?: SourceItem[] } } };
    try {
      json = await response.json() as typeof json;
    } catch {
      return [];
    }

    return json?.data?.sources?.nodes ?? [];
  }

  async batchLookup(
    items: { description: string; unit: string; quantity: number }[],
    zipCode: string,
  ): Promise<BatchLookupResult[]> {
    const results: BatchLookupResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const nodes = await this.fetchSourceItems(item.description, zipCode, item.unit);

      if (nodes.length === 0) {
        results.push({ index: i, matched: false });
        continue;
      }

      const targetUom = mapUnitToOneBuildUom(item.unit);
      const topNode = nodes[0];

      let matchedUomField: SourceItemFields | undefined;
      if (targetUom) {
        matchedUomField = topNode.knownUoms.find(k => k.uom === targetUom);
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
