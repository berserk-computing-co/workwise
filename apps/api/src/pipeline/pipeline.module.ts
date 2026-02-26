import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PipelineRunner } from "./services/pipeline-runner.service.js";
import { JobProgressService } from "./services/job-progress.service.js";
import { PipelineJobService } from "./services/pipeline-job.service.js";
import { PipelineJob } from "./entities/pipeline-job.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([PipelineJob])],
  providers: [PipelineRunner, JobProgressService, PipelineJobService],
  exports: [TypeOrmModule, PipelineRunner, PipelineJobService],
})
export class PipelineModule {}
