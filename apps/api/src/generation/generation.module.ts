import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationController } from './generation.controller.js';
import { GenerationProcessor } from './generation.processor.js';
import { ScopeDecompositionStep } from './steps/scope-decomposition.step.js';
import { PriceResolutionStep } from './steps/price-resolution.step.js';
import { OptionGenerationStep } from './steps/option-generation.step.js';
import { CalculationStep } from './steps/calculation.step.js';
import { Project } from '../projects/entities/project.entity.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { OneBuildModule } from '../datasources/onebuild/onebuild.module.js';
import { PipelineModule } from '../pipeline/pipeline.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'project-generation' }),
    TypeOrmModule.forFeature([Project]),
    ProjectsModule,
    OneBuildModule,
    UsersModule,
    PipelineModule,
  ],
  controllers: [GenerationController],
  providers: [
    GenerationProcessor,
    ScopeDecompositionStep,
    PriceResolutionStep,
    OptionGenerationStep,
    CalculationStep,
  ],
  exports: [BullModule, PipelineModule],
})
export class GenerationModule {}
