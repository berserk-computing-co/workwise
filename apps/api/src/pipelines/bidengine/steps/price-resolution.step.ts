import { Injectable } from "@nestjs/common";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import { OneBuildAgentService } from "../../../datasources/onebuild/onebuild-agent.service.js";
import type { PricingResult } from "../../../datasources/onebuild/onebuild-agent.service.js";
import type { BidEngineContext, PricedItem } from "../bidengine-context.js";
import { ItemSource } from "../bidengine.enums.js";

@Injectable()
export class PriceResolutionStep implements PipelineStep<BidEngineContext> {
  readonly name = "price_resolution";

  constructor(private readonly oneBuildAgent: OneBuildAgentService) {}

  async execute(context: BidEngineContext): Promise<void> {
    const flatItems: {
      description: string;
      quantity: number;
      unit: string;
      unitCost: number;
      category: string;
      sectionName: string;
    }[] = [];
    for (const section of context.sections!) {
      for (const item of section.items) {
        flatItems.push({ ...item, sectionName: section.name });
      }
    }

    const results = await this.oneBuildAgent.priceItems(
      flatItems,
      context.zipCode,
    );

    context.pricedItems = flatItems.map((item, i) => {
      const result = results[i];
      if (result.matched) {
        return {
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: result.unitCost,
          source: ItemSource.AiPriced,
          sourceData: {
            onebuildId: result.onebuildId,
            onebuildName: result.onebuildName,
            materialUnitCost: result.materialUnitCost,
            laborUnitCost: result.laborUnitCost,
            laborSource: result.laborSource,
            confidence: result.confidence,
            category: result.category,
            notes: result.notes,
          },
          sectionName: item.sectionName,
        };
      }
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: result.unitCost,
        source: ItemSource.AiUnmatched,
        sourceData: {
          skipReason: result.skipReason,
          category: result.category,
        },
        sectionName: item.sectionName,
      };
    }) satisfies PricedItem[];
  }
}
