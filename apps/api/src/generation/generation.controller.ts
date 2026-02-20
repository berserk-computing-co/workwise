import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Subscription } from 'rxjs';
import { JobProgressService } from './job-progress.service.js';
import { Public } from '../common/decorators/public.decorator.js';

@Controller()
export class GenerationController {
  constructor(private readonly jobProgress: JobProgressService) {}

  @Public()
  @Get('jobs/:jobId/progress')
  streamProgress(
    @Param('jobId') jobId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    if (!this.jobProgress.has(jobId)) {
      res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Job not found' });
      return;
    }

    const observable = this.jobProgress.subscribe(jobId);
    if (!observable) {
      res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Job not found' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let subscription: Subscription;

    subscription = observable.subscribe({
      next: (event) => {
        let eventType = 'progress';
        if (event.status === 'error') {
          eventType = 'error';
        } else if (event.status === 'complete' && !event.step) {
          eventType = 'complete';
        }
        res.write(`event: ${eventType}\ndata: ${JSON.stringify(event)}\n\n`);
      },
      complete: () => {
        res.write(': stream complete\n\n');
        res.end();
      },
      error: () => {
        res.end();
      },
    });

    req.on('close', () => {
      subscription.unsubscribe();
    });
  }
}
