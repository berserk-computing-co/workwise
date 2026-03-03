import { Injectable, Logger } from '@nestjs/common';
import { PipelineStep } from '../../../pipeline/pipeline-step.interface.js';
import { PricingFanOutService } from '../agents/pricing-fan-out.service.js';
import type { BidEngineContext } from '../bidengine-context.js';

@Injectable()
export class WebPriceResolutionStep implements PipelineStep<BidEngineContext> {
  readonly name = 'web_price_resolution';

  private readonly logger = new Logger(WebPriceResolutionStep.name);

  constructor(private readonly pricingFanOut: PricingFanOutService) {}

  async execute(context: BidEngineContext, signal: AbortSignal): Promise<void> {
    this.logger.log(
      `Starting web price resolution: ${context.sections!.length} sections, ZIP=${context.zipCode}`,
    );

    // TODO: Pass city/state from the project. The context currently only has zipCode.
    // Either add city/state to BidEngineContext, or load the project entity here.
    // For now, passing null — the fan-out service handles null gracefully.
    const pricedItems = await this.pricingFanOut.priceAll(
      context.sections!,
      context.zipCode,
      null, // city — TODO: populate from project
      null, // state — TODO: populate from project
      signal,
    );

    const matched = pricedItems.filter((p) => p.sourceUrl).length;
    this.logger.log(
      `Web price resolution complete: ${pricedItems.length} items, ${matched} with source URLs`,
    );

    context.pricedItems = pricedItems;
  }
}
