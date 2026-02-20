import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { StytchAuthGuard } from './auth/stytch-auth.guard.js';
import { UsersModule } from './users/users.module.js';
import { EstimatesModule } from './estimates/estimates.module.js';
import { GenerationModule } from './generation/generation.module.js';
import { OneBuildModule } from './onebuild/onebuild.module.js';
import { AiModule } from './ai/ai.module.js';
import { typeOrmConfigFactory } from './config/database.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    AuthModule,
    UsersModule,
    EstimatesModule,
    GenerationModule,
    OneBuildModule,
    AiModule,
  ],
  providers: [
    StytchAuthGuard,
    {
      provide: APP_GUARD,
      useExisting: StytchAuthGuard,
    },
  ],
})
export class AppModule {}
