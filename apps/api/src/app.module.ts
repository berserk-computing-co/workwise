import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { StytchAuthGuard } from './auth/stytch-auth.guard.js';
import { UsersModule } from './users/users.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { GenerationModule } from './generation/generation.module.js';
import { OneBuildModule } from './datasources/onebuild/onebuild.module.js';
import { AiModule } from './ai/ai.module.js';
import { PipelineModule } from './pipeline/pipeline.module.js';
import { typeOrmConfigFactory } from './config/database.config.js';
import { Auth0AuthGuard } from './auth/auth0-auth.guard.js';

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
    ProjectsModule,
    GenerationModule,
    OneBuildModule,
    AiModule,
    PipelineModule,
  ],
  providers: [
    Auth0AuthGuard,
    {
      provide: APP_GUARD,
      useExisting: Auth0AuthGuard,
    },
  ],
})
export class AppModule {}
