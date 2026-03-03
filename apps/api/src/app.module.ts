import { Module, OnApplicationBootstrap, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, InjectDataSource } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { APP_GUARD } from "@nestjs/core";
import { DataSource } from "typeorm";
import { AuthModule } from "./auth/auth.module.js";
import { StytchAuthGuard } from "./auth/stytch-auth.guard.js";
import { UsersModule } from "./users/users.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { BidEngineModule } from "./pipelines/bidengine/bidengine.module.js";
import { OneBuildModule } from "./datasources/onebuild/onebuild.module.js";
import { AiModule } from "./ai/ai.module.js";
import { PipelineModule } from "./pipeline/pipeline.module.js";
import { RedisModule } from "./config/redis.module.js";
import { typeOrmConfigFactory } from "./config/database.config.js";
import { Auth0AuthGuard } from "./auth/auth0-auth.guard.js";
import { User } from "./users/entities/user.entity.js";
import { Organization } from "./users/entities/organization.entity.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
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
          host: config.get<string>("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
        },
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    BidEngineModule,
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
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.DEV_SKIP_AUTH !== "true") return;

    const orgRepo = this.dataSource.getRepository(Organization);
    const userRepo = this.dataSource.getRepository(User);

    let org = await orgRepo.findOne({ where: { name: "Dev Organization" } });
    if (!org) {
      org = await orgRepo.save(
        orgRepo.create({
          name: "Dev Organization",
          zipCode: "00000",
          settings: {},
        }),
      );
    }

    const existing = await userRepo.findOne({ where: { authId: "dev|local" } });
    if (!existing) {
      await userRepo.save(
        userRepo.create({
          authId: "dev|local",
          email: "dev@local.test",
          firstName: "Dev",
          lastName: "User",
          organizationId: org.id,
        }),
      );
      this.logger.log("[DEV] Seeded dev user: dev@local.test");
    }
  }
}
