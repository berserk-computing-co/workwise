import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS } from "../../config/redis.module.js";

@Injectable()
export class CancellationService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async requestCancellation(jobId: string): Promise<void> {
    await this.redis.set(`job:${jobId}:cancel`, "1", "EX", 600);
  }

  async isCancelled(jobId: string): Promise<boolean> {
    return (await this.redis.get(`job:${jobId}:cancel`)) === "1";
  }

  async cleanup(jobId: string): Promise<void> {
    await this.redis.del(`job:${jobId}:cancel`);
  }

  /**
   * Returns an AbortController that auto-aborts when the Redis
   * cancel flag is set. Caller MUST call cleanup on the returned
   * object when done.
   */
  watch(jobId: string): { controller: AbortController; cleanup: () => void } {
    const controller = new AbortController();

    const interval = setInterval(async () => {
      if (await this.isCancelled(jobId)) {
        controller.abort(new Error("Job cancelled by user"));
      }
    }, 500);

    // Also stop polling if already aborted some other way
    controller.signal.addEventListener("abort", () => clearInterval(interval), {
      once: true,
    });

    return {
      controller,
      cleanup: () => {
        clearInterval(interval);
        this.cleanup(jobId);
      },
    };
  }
}
