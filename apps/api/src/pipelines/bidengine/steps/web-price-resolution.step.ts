import { Injectable, Logger } from "@nestjs/common";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import { WebPricingAgentService } from "../agents/web-pricing-agent.service.js";
import type { BidEngineContext, PricedItem } from "../bidengine-context.js";
import { ItemSource } from "../bidengine.enums.js";

@Injectable()
export class WebPriceResolutionStep implements PipelineStep<BidEngineContext> {
  readonly name = "web_price_resolution";

  private readonly logger = new Logger(WebPriceResolutionStep.name);

  constructor(private readonly webPricingAgent: WebPricingAgentService) {}

  async execute(context: BidEngineContext): Promise<void> {
    const flatItems: {
      description: string;
      quantity: number;
      unit: string;
      category: string;
      sectionName: string;
    }[] = [];
    for (const section of context.sections!) {
      for (const item of section.items) {
        flatItems.push({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          sectionName: section.name,
        });
      }
    }

    this.logger.log(
      `Starting web price resolution: ${flatItems.length} items from ${context.sections!.length} sections, ZIP=${context.zipCode}`,
    );

    try {
      const results = await this.webPricingAgent.priceItems(
        flatItems,
        context.zipCode,
      );

      const matched = results.filter((r) => r.matched).length;
      const skipped = results.filter((r) => !r.matched).length;
      this.logger.log(
        `Web pricing results: ${matched} matched, ${skipped} skipped out of ${results.length} total`,
      );

      context.webResults = flatItems.map((item, i) => {
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
            source: ItemSource.WebPriced,
            sourceData: {
              retailer: result.retailer,
              productUrl: result.productUrl,
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
      this.logger.error(
        `Web pricing failed: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      context.webResults = [];
    }
  }
}
