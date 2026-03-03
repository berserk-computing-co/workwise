import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Job } from 'bullmq';
import { Project } from '../../projects/entities/project.entity.js';
import { PipelineRunner } from '../../pipeline/services/pipeline-runner.service.js';
import { PipelineJobService } from '../../pipeline/services/pipeline-job.service.js';
import type { StepStatus } from '../../pipeline/pipeline.enums.js';
import { ScopeDecompositionStep } from './steps/scope-decomposition.step.js';
import { WebPriceResolutionStep } from './steps/web-price-resolution.step.js';
import { OptionGenerationStep } from './steps/option-generation.step.js';
import { CalculationStep } from './steps/calculation.step.js';
import type { BidEngineContext } from './bidengine-context.js';
import { CancellationService } from '../../pipeline/services/cancellation.service.js';

@Injectable()
@Processor('project-generation')
export class BidEngineProcessor extends WorkerHost {
  private readonly logger = new Logger(BidEngineProcessor.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly pipelineRunner: PipelineRunner,
    private readonly pipelineJobs: PipelineJobService,
    private readonly scopeStep: ScopeDecompositionStep,
    private readonly optionStep: OptionGenerationStep,
    private readonly calcStep: CalculationStep,
    private readonly webPriceStep: WebPriceResolutionStep,
    private readonly cancellationService: CancellationService,
  ) {
    super();
  }

  async process(
    job: Job<{ projectId: string; organizationId: string }>,
  ): Promise<void> {
    const { projectId } = job.data;

    const { controller, cleanup } = this.cancellationService.watch(job.id!);

    this.logger.log(`Processing job ${job.id} for project ${projectId}`);

    try {
      await this.pipelineJobs.start(job.id!);

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

      this.logger.log(
        `Pipeline context: project=${project.id}, category="${project.category}", zip=${project.zipCode}, description="${project.description?.slice(0, 100)}"`,
      );

      const onProgress = (
        step: string,
        status: StepStatus,
        message: string,
      ) => {
        this.pipelineJobs.updateStep(job.id!, step, status, message);
      };

      await this.pipelineRunner.run(
        job.id!,
        context,
        [
          this.scopeStep,
          this.webPriceStep,
          this.optionStep,
          this.calcStep,
        ],
        onProgress,
        controller,
      );

      await this.pipelineJobs.complete(job.id!, {
        total: context.totals!.total,
      });
      await this.projectRepo.update(projectId, {
        status: 'review',
        currentJobId: null,
      });
      this.logger.log(
        `Job ${job.id} completed — total: ${context.totals!.total}`,
      );
    } catch (error) {
      const isCancelled =
        error instanceof Error && error.message === 'Job cancelled by user';

      if (isCancelled) {
        this.logger.log(`Job ${job.id} cancelled by user`);
        await this.pipelineJobs.cancel(job.id!);
        await this.projectRepo.update(projectId, {
          status: 'cancelled',
          currentJobId: null,
        });
      } else {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Job ${job.id} failed: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );
        await this.pipelineJobs.fail(job.id!, message);
        await this.projectRepo.update(projectId, {
          status: 'draft',
          currentJobId: null,
        });
      }

      if (!isCancelled) throw error;
    } finally {
      cleanup();
    }
  }
}
