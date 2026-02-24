import { Injectable } from '@nestjs/common';
import { PipelineStep } from './pipeline-step.interface.js';

@Injectable()
export class PipelineRunner {
  async run<TContext>(
    jobId: string,
    context: TContext,
    steps: PipelineStep<TContext>[],
    onProgress: (step: string, status: string, message: string) => void,
  ): Promise<void> {
    for (const step of steps) {
      onProgress(step.name, 'running', `Starting ${step.name}...`);
      await step.execute(context);
      onProgress(step.name, 'complete', `${step.name} complete`);
    }
  }
}
