import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { Job } from "bullmq";
import { Project } from "../../projects/entities/project.entity.js";
import { PipelineRunner } from "../../pipeline/pipeline-runner.service.js";
import { JobProgressService } from "../../pipeline/job-progress.service.js";
import { ScopeDecompositionStep } from "./steps/scope-decomposition.step.js";
import { PriceResolutionStep } from "./steps/price-resolution.step.js";
import { OptionGenerationStep } from "./steps/option-generation.step.js";
import { CalculationStep } from "./steps/calculation.step.js";
import type { BidEngineContext } from "./bidengine-context.js";

@Injectable()
@Processor("project-generation")
export class BidEngineProcessor extends WorkerHost {
  private readonly logger = new Logger(BidEngineProcessor.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly pipelineRunner: PipelineRunner,
    private readonly jobProgress: JobProgressService,
    private readonly scopeStep: ScopeDecompositionStep,
    private readonly priceStep: PriceResolutionStep,
    private readonly optionStep: OptionGenerationStep,
    private readonly calcStep: CalculationStep,
  ) {
    super();
  }

  async process(
    job: Job<{ projectId: string; organizationId: string }>,
  ): Promise<void> {
    const { projectId } = job.data;

    this.logger.log(`Processing job ${job.id} for project ${projectId}`);

    try {
      const project = await this.projectRepo.findOneOrFail({
        where: { id: projectId },
      });

      const context: BidEngineContext = {
        projectId: project.id,
        description: project.description,
        address: project.address,
        zipCode: project.zipCode,
        category: project.category,
      };

      const onProgress = (step: string, status: string, message: string) => {
        this.jobProgress.emit(job.id!, {
          step,
          status: status as "running" | "complete",
          message,
        });
      };

      await this.pipelineRunner.run(
        job.id!,
        context,
        [this.scopeStep, this.priceStep, this.optionStep, this.calcStep],
        onProgress,
      );

      this.jobProgress.emit(job.id!, {
        step: "",
        status: "complete",
        message: "Project generated",
        projectId,
        total: context.totals!.total,
      });
      this.jobProgress.complete(job.id!);
      this.logger.log(
        `Job ${job.id} completed — total: ${context.totals!.total}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Job ${job.id} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.jobProgress.error(job.id!, {
        step: "pipeline",
        status: "error",
        message,
      });
      throw error;
    }
  }
}
