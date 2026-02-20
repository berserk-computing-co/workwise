import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GenerationController } from './generation.controller.js';
import { JobProgressService } from './job-progress.service.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'estimate-generation' }),
  ],
  controllers: [GenerationController],
  providers: [JobProgressService],
  exports: [BullModule, JobProgressService],
})
export class GenerationModule {}
