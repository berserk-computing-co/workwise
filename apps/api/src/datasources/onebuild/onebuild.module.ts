import { Module } from '@nestjs/common';
import { OneBuildController } from './onebuild.controller.js';
import { OneBuildService } from './onebuild.service.js';

@Module({
  controllers: [OneBuildController],
  providers: [OneBuildService],
  exports: [OneBuildService],
})
export class OneBuildModule {}
