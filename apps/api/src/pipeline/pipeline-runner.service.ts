import { Injectable, Logger } from '@nestjs/common';
import { PipelineStep } from './pipeline-step.interface.js';

@Injectable()
export class PipelineRunner {
  private readonly logger = new Logger(PipelineRunner.name);

  async run<TContext>(
    jobId: string,
    context: TContext,
    steps: PipelineStep<TContext>[],
    onProgress: (step: string, status: string, message: string) => void,
  ): Promise<void> {
    this.logger.log(`Pipeline started (${steps.length} steps) for job ${jobId}`);
    for (const step of steps) {
      this.logger.log(`[${jobId}] Running step: ${step.name}`);
      onProgress(step.name, 'running', `Starting ${step.name}...`);
      await step.execute(context);
      this.logger.log(`[${jobId}] Step complete: ${step.name}`);
      onProgress(step.name, 'complete', `${step.name} complete`);
    }
    this.logger.log(`Pipeline finished for job ${jobId}`);
  }
}
