import { ConfigService } from "@nestjs/config";
import type { RedisOptions } from "ioredis";

export const redisConfigFactory = (config: ConfigService): RedisOptions => ({
  host: config.get<string>("REDIS_HOST", "localhost"),
  port: config.get<number>("REDIS_PORT", 6379),
  password: config.get<string>("REDIS_PASSWORD"),
  maxRetriesPerRequest: null, // BullMQ requires this
});
