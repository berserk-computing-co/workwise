import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Job } from 'bullmq';
import { Estimate } from '../estimates/entities/estimate.entity.js';
import { Company } from '../users/entities/company.entity.js';
import { PipelineRunner } from '../common/pipeline/pipeline-runner.service.js';
import { JobProgressService } from './job-progress.service.js';
import { ScopeDecompositionStep } from './steps/scope-decomposition.step.js';
import { PriceResolutionStep } from './steps/price-resolution.step.js';
import { OptionGenerationStep } from './steps/option-generation.step.js';
import { CalculationStep } from './steps/calculation.step.js';
import type { GenerationContext } from './generation-context.js';

@Injectable()
@Processor('estimate-generation')
export class GenerationProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Estimate)
    private readonly estimateRepo: Repository<Estimate>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly pipelineRunner: PipelineRunner,
    private readonly jobProgress: JobProgressService,
    private readonly scopeStep: ScopeDecompositionStep,
    private readonly priceStep: PriceResolutionStep,
    private readonly optionStep: OptionGenerationStep,
    private readonly calcStep: CalculationStep,
  ) {
    super();
  }

  async process(job: Job<{ estimateId: string; companyId: string }>): Promise<void> {
    const { estimateId, companyId } = job.data;

    try {
      const estimate = await this.estimateRepo.findOneOrFail({ where: { id: estimateId } });
      const company = await this.companyRepo.findOneOrFail({ where: { id: companyId } });

      const context: GenerationContext = {
        estimateId: estimate.id,
        projectDescription: estimate.projectDescription,
        jobSiteAddress: estimate.jobSiteAddress,
        zipCode: estimate.zipCode,
        tradeCategory: estimate.tradeCategory,
        propertyType: estimate.propertyType,
        companyRates: {
          hourlyRate: Number(company.hourlyRate),
          burdenMultiplier: Number(company.burdenMultiplier),
          overheadMultiplier: Number(company.overheadMultiplier),
          profitMargin: Number(company.profitMargin),
          taxRate: Number(company.taxRate),
        },
      };

      const onProgress = (step: string, status: string, message: string) => {
        this.jobProgress.emit(job.id!, { step, status: status as 'running' | 'complete', message });
      };

      await this.pipelineRunner.run(
        job.id!,
        context,
        [this.scopeStep, this.priceStep, this.optionStep, this.calcStep],
        onProgress,
      );

      this.jobProgress.emit(job.id!, {
        step: '',
        status: 'complete',
        message: 'Estimate generated',
        estimateId,
        total: context.totals!.total,
      });
      this.jobProgress.complete(job.id!);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.jobProgress.error(job.id!, {
        step: 'pipeline',
        status: 'error',
        message,
      });
      throw error;
    }
  }
}
