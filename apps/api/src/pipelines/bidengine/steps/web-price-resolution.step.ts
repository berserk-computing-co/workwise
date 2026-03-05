import { Injectable, Logger } from '@nestjs/common';
import { PipelineStep } from '../../../pipeline/pipeline-step.interface.js';
import { PricingFanOutService } from '../agents/pricing-fan-out.service.js';
import { JobProgressService } from '../../../pipeline/services/job-progress.service.js';
import { StepStatus } from '../../../pipeline/pipeline.enums.js';
import type { BidEngineContext } from '../bidengine-context.js';

@Injectable()
export class WebPriceResolutionStep implements PipelineStep<BidEngineContext> {
  readonly name = 'web_price_resolution';

  private readonly logger = new Logger(WebPriceResolutionStep.name);

  constructor(
    private readonly pricingFanOut: PricingFanOutService,
    private readonly jobProgress: JobProgressService,
  ) {}

  async execute(context: BidEngineContext, signal: AbortSignal): Promise<void> {
    this.logger.log(
      `Starting web price resolution: ${context.sections!.length} sections, ZIP=${context.zipCode}`,
    );

    const onBatchProgress = context.jobId
      ? (completed: number, total: number) => {
          this.jobProgress.emit(context.jobId!, {
            step: 'web_price_resolution',
            status: StepStatus.Running,
            message: `Pricing batch ${completed}/${total}...`,
          });
        }
      : undefined;

    const pricedItems = await this.pricingFanOut.priceAll(
      context.sections!,
      context.zipCode,
      context.city,
      context.state,
      signal,
      onBatchProgress,
    );

    const matched = pricedItems.filter((p) => p.sourceUrl).length;
    this.logger.log(
      `Web price resolution complete: ${pricedItems.length} items, ${matched} with source URLs`,
    );

    context.pricedItems = pricedItems;
  }
}
