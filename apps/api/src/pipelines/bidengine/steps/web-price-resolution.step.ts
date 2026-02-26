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
      unitCost: number;
      category: string;
      sectionName: string;
    }[] = [];
    for (const section of context.sections!) {
      for (const item of section.items) {
        flatItems.push({ ...item, sectionName: section.name });
      }
    }

    try {
      const results = await this.webPricingAgent.priceItems(
        flatItems,
        context.zipCode,
      );
      context.webResults = flatItems.map((item, i) => {
        const result = results[i];
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
      this.logger.warn(
        `Web pricing failed, continuing with empty results: ${error instanceof Error ? error.message : error}`,
      );
      context.webResults = [];
    }
  }
}
