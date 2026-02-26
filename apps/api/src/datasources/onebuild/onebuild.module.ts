import { Module } from "@nestjs/common";
import { OneBuildController } from "./onebuild.controller.js";
import { OneBuildService } from "./onebuild.service.js";
import { OneBuildAgentService } from "./onebuild-agent.service.js";

@Module({
  controllers: [OneBuildController],
  providers: [OneBuildService, OneBuildAgentService],
  exports: [OneBuildService, OneBuildAgentService],
})
export class OneBuildModule {}
