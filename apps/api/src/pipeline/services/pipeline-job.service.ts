import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { Observable } from "rxjs";
import { PipelineJob } from "../entities/pipeline-job.entity.js";
import { JobProgressService } from "./job-progress.service.js";
import type { ProgressEvent } from "./job-progress.service.js";
import {
  JobStatus,
  StepStatus,
  TargetType,
  PipelineType,
} from "../pipeline.enums.js";

export interface CreatePipelineJobInput {
  targetId: string;
  targetType?: TargetType;
  pipelineType: PipelineType;
  triggeredBy: string;
}

@Injectable()
export class PipelineJobService {
  private readonly logger = new Logger(PipelineJobService.name);

  constructor(
    @InjectRepository(PipelineJob)
    private readonly repo: Repository<PipelineJob>,
    private readonly progress: JobProgressService,
  ) {}

  /** Create a DB record + SSE stream for a new pipeline job. */
  async create(input: CreatePipelineJobInput): Promise<PipelineJob> {
    const job = this.repo.create({
      targetId: input.targetId,
      targetType: input.targetType ?? TargetType.Project,
      pipelineType: input.pipelineType,
      triggeredBy: input.triggeredBy,
      status: JobStatus.Pending,
    });
    const saved = await this.repo.save(job);
    this.progress.createJob(saved.id);
    this.logger.log(`Created pipeline job ${saved.id} (${input.pipelineType})`);
    return saved;
  }

  /** Mark the job as running and record the start time. */
  async start(jobId: string): Promise<void> {
    await this.repo.update(jobId, {
      status: JobStatus.Running,
      startedAt: new Date(),
    });
  }

  /** Update the current step — persists to DB and emits SSE. */
  async updateStep(
    jobId: string,
    step: string,
    status: StepStatus,
    message: string,
  ): Promise<void> {
    await this.repo.update(jobId, { currentStep: step });
    this.progress.emit(jobId, { step, status, message });
  }

  /** Mark the job as completed — persists to DB and closes SSE stream. */
  async complete(jobId: string, result?: { total?: number }): Promise<void> {
    await this.repo.update(jobId, {
      status: JobStatus.Completed,
      completedAt: new Date(),
      currentStep: null,
    });
    this.progress.emit(jobId, {
      step: "",
      status: StepStatus.Complete,
      message: "Pipeline completed",
      ...result,
    });
    this.progress.complete(jobId);
  }

  /** Mark the job as failed — persists error to DB and closes SSE stream. */
  async fail(jobId: string, error: string): Promise<void> {
    await this.repo.update(jobId, {
      status: JobStatus.Failed,
      completedAt: new Date(),
      errors: { message: error },
    });
    this.progress.error(jobId, {
      step: "pipeline",
      status: StepStatus.Error,
      message: error,
    });
  }

  /** Record token usage from an LLM call. */
  async recordUsage(
    jobId: string,
    inputTokens: number,
    outputTokens: number,
  ): Promise<void> {
    await this.repo.increment({ id: jobId }, "totalInputTokens", inputTokens);
    await this.repo.increment({ id: jobId }, "totalOutputTokens", outputTokens);
  }

  /** Subscribe to the SSE progress stream. */
  subscribe(jobId: string): Observable<ProgressEvent> | null {
    return this.progress.subscribe(jobId);
  }

  /** Check if a job's SSE stream exists. */
  has(jobId: string): boolean {
    return this.progress.has(jobId);
  }

  /** Find a job by ID or throw. */
  async findOrFail(jobId: string): Promise<PipelineJob> {
    const job = await this.repo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Pipeline job not found");
    return job;
  }
}
