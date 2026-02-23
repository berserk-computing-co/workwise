import { Module } from '@nestjs/common';
import { PipelineRunner } from './pipeline-runner.service.js';
import { JobProgressService } from './job-progress.service.js';

@Module({
  providers: [PipelineRunner, JobProgressService],
  exports: [PipelineRunner, JobProgressService],
})
export class PipelineModule {}
