import { Injectable } from "@nestjs/common";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import { OneBuildService } from "../../../datasources/onebuild/onebuild.service.js";
import type { BidEngineContext, PricedItem } from "../bidengine-context.js";

@Injectable()
export class PriceResolutionStep implements PipelineStep<BidEngineContext> {
  readonly name = "price_resolution";

  constructor(private readonly oneBuildService: OneBuildService) {}

  async execute(context: BidEngineContext): Promise<void> {
    const flatItems: {
      description: string;
      quantity: number;
      unit: string;
      unitCost: number;
      sectionName: string;
    }[] = [];
    for (const section of context.sections!) {
      for (const item of section.items) {
        flatItems.push({ ...item, sectionName: section.name });
      }
    }

    const results = await this.oneBuildService.batchLookup(
      flatItems.map((item) => ({
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
      })),
      context.zipCode,
    );

    context.pricedItems = flatItems.map((item, i) => {
      const match = results[i];
      if (match?.matched) {
        return {
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: match.unit_cost!,
          source: "ai_priced" as const,
          sourceData: {
            onebuildId: match.onebuild_id,
            matchScore: match.match_score,
          },
          sectionName: item.sectionName,
        };
      }
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        source: "ai_unmatched" as const,
        sourceData: {},
        sectionName: item.sectionName,
      };
    }) satisfies PricedItem[];
  }
}
