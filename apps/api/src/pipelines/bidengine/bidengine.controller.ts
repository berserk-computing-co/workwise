import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import type { Request, Response } from "express";
import type { Subscription } from "rxjs";
import { PipelineJobService } from "../../pipeline/services/pipeline-job.service.js";
import { CancellationService } from "../../pipeline/services/cancellation.service.js";
import {
  StepStatus,
  TargetType,
  PipelineType,
} from "../../pipeline/pipeline.enums.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { Project } from "../../projects/entities/project.entity.js";
import { UsersService } from "../../users/services/users.service.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { JwtPayload } from "../../common/decorators/current-user.decorator.js";

@Controller()
export class BidEngineController {
  constructor(
    private readonly pipelineJobs: PipelineJobService,
    private readonly cancellationService: CancellationService,
    @InjectQueue("project-generation") private readonly generationQueue: Queue,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly usersService: UsersService,
  ) {}

  @Post("projects/:id/generate")
  @HttpCode(202)
  async generate(@CurrentUser() payload: JwtPayload, @Param("id") id: string) {
    const user = await this.usersService.findByAuthIdOrFail(payload.sub);
    const project = await this.projectRepo.findOne({ where: { id } });

    if (!project) throw new NotFoundException("Project not found");

    if (project.organizationId !== user.organizationId)
      throw new ForbiddenException("Access denied");

    const job = await this.pipelineJobs.create({
      targetId: project.id,
      targetType: TargetType.Project,
      pipelineType: PipelineType.BidEngine,
      triggeredBy: user.id,
    });

    await this.projectRepo.update(id, {
      status: "generating",
      currentJobId: job.id,
    });

    await this.generationQueue.add(
      "generate",
      { projectId: id, organizationId: user.organizationId },
      { jobId: job.id },
    );

    return { jobId: job.id };
  }

  @Post("projects/:id/cancel")
  @HttpCode(200)
  async cancel(@CurrentUser() payload: JwtPayload, @Param("id") id: string) {
    const user = await this.usersService.findByAuthIdOrFail(payload.sub);
    const project = await this.projectRepo.findOne({ where: { id } });

    if (!project) throw new NotFoundException("Project not found");

    if (project.organizationId !== user.organizationId)
      throw new ForbiddenException("Access denied");

    if (project.status !== "generating" || !project.currentJobId)
      throw new BadRequestException("Project is not currently generating");

    await this.cancellationService.requestCancellation(project.currentJobId);

    return { cancelled: true };
  }

  @Public()
  @Get("jobs/:jobId/progress")
  async streamProgress(
    @Param("jobId") jobId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // If the SSE subject is still alive, subscribe normally.
    // If it's gone (page refresh after completion, late connect, etc.),
    // look up the DB record and send the terminal state immediately.
    const observable = this.pipelineJobs.subscribe(jobId);

    if (!observable) {
      const job = await this.pipelineJobs
        .findOrFail(jobId)
        .catch(() => null);

      if (!job) {
        res.status(404).json({
          statusCode: 404,
          error: "Not Found",
          message: "Job not found",
        });
        return;
      }

      // Job exists in DB but SSE subject is gone — send terminal state
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      if (job.status === "completed") {
        res.write(
          `event: complete\ndata: ${JSON.stringify({ step: "", status: StepStatus.Complete, message: "Pipeline completed" })}\n\n`,
        );
      } else if (job.status === "failed") {
        const msg =
          (job.errors as { message?: string } | null)?.message ??
          "Generation failed";
        res.write(
          `event: error\ndata: ${JSON.stringify({ step: "pipeline", status: StepStatus.Error, message: msg })}\n\n`,
        );
      }

      res.end();
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let subscription: Subscription;

    subscription = observable.subscribe({
      next: (event) => {
        let eventType = "progress";
        if (event.status === StepStatus.Error) {
          eventType = "error";
        } else if (event.status === StepStatus.Complete && !event.step) {
          eventType = "complete";
        }
        res.write(`event: ${eventType}\ndata: ${JSON.stringify(event)}\n\n`);
      },
      complete: () => {
        res.write(": stream complete\n\n");
        res.end();
      },
      error: () => {
        res.end();
      },
    });

    req.on("close", () => {
      subscription.unsubscribe();
    });
  }
}
