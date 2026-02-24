import {
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
import { Subscription } from "rxjs";
import { JobProgressService } from "../../pipeline/job-progress.service.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { Project } from "../../projects/entities/project.entity.js";
import { UsersService } from "../../users/users.service.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { JwtPayload } from "../../common/decorators/current-user.decorator.js";

@Controller()
export class BidEngineController {
  constructor(
    private readonly jobProgress: JobProgressService,
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

    const jobId = `gen_${id}_${Date.now()}`;
    this.jobProgress.createJob(jobId);
    await this.generationQueue.add(
      "generate",
      { projectId: id, organizationId: user.organizationId },
      { jobId },
    );

    return { jobId };
  }

  @Public()
  @Get("jobs/:jobId/progress")
  streamProgress(
    @Param("jobId") jobId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    if (!this.jobProgress.has(jobId)) {
      res.status(404).json({
        statusCode: 404,
        error: "Not Found",
        message: "Job not found",
      });
      return;
    }

    const observable = this.jobProgress.subscribe(jobId);
    if (!observable) {
      res.status(404).json({
        statusCode: 404,
        error: "Not Found",
        message: "Job not found",
      });
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
        if (event.status === "error") {
          eventType = "error";
        } else if (event.status === "complete" && !event.step) {
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
