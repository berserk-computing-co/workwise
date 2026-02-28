import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { redisConfigFactory } from "./redis.config.js";

export const REDIS = Symbol("REDIS");

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (config: ConfigService) =>
        new Redis(redisConfigFactory(config)),
      inject: [ConfigService],
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
