import { Injectable, Logger } from "@nestjs/common";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import { OneBuildAgentService } from "../../../datasources/onebuild/onebuild-agent.service.js";
import type { PricingResult } from "../../../datasources/onebuild/onebuild-agent.service.js";
import type { BidEngineContext, PricedItem } from "../bidengine-context.js";
import { ItemSource } from "../bidengine.enums.js";

@Injectable()
export class PriceResolutionStep implements PipelineStep<BidEngineContext> {
  readonly name = "price_resolution";

  private readonly logger = new Logger(PriceResolutionStep.name);

  constructor(private readonly oneBuildAgent: OneBuildAgentService) {}

  async execute(context: BidEngineContext, signal: AbortSignal): Promise<void> {
    const flatItems: {
      description: string;
      quantity: number;
      unit: string;
      category: string;
      sectionName: string;
      pricingHint?: string;
    }[] = [];
    for (const section of context.sections!) {
      for (const item of section.items) {
        flatItems.push({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          sectionName: section.name,
          pricingHint: item.pricing_hint,
        });
      }
    }

    this.logger.log(
      `Starting OneBuild price resolution: ${flatItems.length} items from ${context.sections!.length} sections, ZIP=${context.zipCode}`,
    );

    try {
      const results = await this.oneBuildAgent.priceItems(
        flatItems,
        context.zipCode,
        signal,
      );

      const matched = results.filter((r) => r.matched).length;
      const skipped = results.filter((r) => !r.matched).length;
      this.logger.log(
        `OneBuild results: ${matched} matched, ${skipped} skipped out of ${results.length} total`,
      );

      context.oneBuildResults = flatItems.map((item, i) => {
        const result = results[i];
        if (!result) {
          return {
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: 0,
            source: ItemSource.AiUnmatched,
            sourceData: { skipReason: "no result returned by agent" },
            sectionName: item.sectionName,
          };
        }
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
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `OneBuild price resolution failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );
      context.oneBuildResults = [];
    }
  }
}
