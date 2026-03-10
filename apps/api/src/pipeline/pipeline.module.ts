import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineRunner } from './services/pipeline-runner.service.js';
import { JobProgressService } from './services/job-progress.service.js';
import { PipelineJobService } from './services/pipeline-job.service.js';
import { CancellationService } from './services/cancellation.service.js';
import { PipelineJob } from './entities/pipeline-job.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PipelineJob])],
  providers: [
    PipelineRunner,
    JobProgressService,
    PipelineJobService,
    CancellationService,
  ],
  exports: [
    TypeOrmModule,
    PipelineRunner,
    PipelineJobService,
    CancellationService,
    JobProgressService,
  ],
})
export class PipelineModule {}
