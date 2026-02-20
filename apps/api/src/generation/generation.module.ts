import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationController } from './generation.controller.js';
import { GenerationProcessor } from './generation.processor.js';
import { JobProgressService } from './job-progress.service.js';
import { PipelineRunner } from '../common/pipeline/pipeline-runner.service.js';
import { ScopeDecompositionStep } from './steps/scope-decomposition.step.js';
import { PriceResolutionStep } from './steps/price-resolution.step.js';
import { OptionGenerationStep } from './steps/option-generation.step.js';
import { CalculationStep } from './steps/calculation.step.js';
import { Estimate } from '../estimates/entities/estimate.entity.js';
import { Company } from '../users/entities/company.entity.js';
import { EstimatesModule } from '../estimates/estimates.module.js';
import { OneBuildModule } from '../onebuild/onebuild.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'estimate-generation' }),
    TypeOrmModule.forFeature([Estimate, Company]),
    EstimatesModule,
    OneBuildModule,
    UsersModule,
  ],
  controllers: [GenerationController],
  providers: [
    JobProgressService,
    GenerationProcessor,
    PipelineRunner,
    ScopeDecompositionStep,
    PriceResolutionStep,
    OptionGenerationStep,
    CalculationStep,
  ],
  exports: [BullModule, JobProgressService],
})
export class GenerationModule {}
