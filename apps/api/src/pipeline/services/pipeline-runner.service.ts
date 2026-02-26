import { Injectable, Logger } from "@nestjs/common";
import { PipelineStep, PipelineStepInput } from "../pipeline-step.interface.js";
import { StepStatus } from "../pipeline.enums.js";

@Injectable()
export class PipelineRunner {
  private readonly logger = new Logger(PipelineRunner.name);

  async run<TContext>(
    jobId: string,
    context: TContext,
    steps: PipelineStepInput<TContext>[],
    onProgress: (step: string, status: StepStatus, message: string) => void,
  ): Promise<void> {
    const totalCount = steps.reduce(
      (acc, entry) => acc + (Array.isArray(entry) ? entry.length : 1),
      0,
    );
    this.logger.log(`Pipeline started (${totalCount} steps) for job ${jobId}`);

    for (const entry of steps) {
      if (!Array.isArray(entry)) {
        // Sequential step — errors throw and abort the pipeline
        const step = entry as PipelineStep<TContext>;
        this.logger.log(`[${jobId}] Running step: ${step.name}`);
        onProgress(step.name, StepStatus.Running, `Starting ${step.name}...`);
        await step.execute(context);
        this.logger.log(`[${jobId}] Step complete: ${step.name}`);
        onProgress(step.name, StepStatus.Complete, `${step.name} complete`);
      } else {
        // Parallel group — fire all, collect results, never throw
        const group = entry as PipelineStep<TContext>[];
        this.logger.log(
          `[${jobId}] Running parallel group: [${group.map((s) => s.name).join(", ")}]`,
        );
        for (const step of group) {
          onProgress(step.name, StepStatus.Running, `Starting ${step.name}...`);
        }

        const results = await Promise.allSettled(
          group.map((step) => step.execute(context)),
        );

        const succeeded: string[] = [];
        const failed: string[] = [];

        results.forEach((result, i) => {
          const step = group[i];
          if (result.status === "fulfilled") {
            succeeded.push(step.name);
            onProgress(step.name, StepStatus.Complete, `${step.name} complete`);
          } else {
            const err = result.reason as Error;
            failed.push(step.name);
            onProgress(
              step.name,
              StepStatus.Error,
              err?.message ?? "Unknown error",
            );
            this.logger.error(
              `[${jobId}] Parallel step failed: ${step.name} — ${err?.message}`,
              err?.stack,
            );
          }
        });

        if (succeeded.length > 0) {
          this.logger.log(
            `[${jobId}] Parallel group succeeded: [${succeeded.join(", ")}]`,
          );
        }
        if (failed.length > 0) {
          this.logger.log(
            `[${jobId}] Parallel group failed: [${failed.join(", ")}] — continuing pipeline`,
          );
        }
      }
    }

    this.logger.log(`Pipeline finished for job ${jobId}`);
  }
}
