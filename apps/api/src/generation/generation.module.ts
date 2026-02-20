import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'estimate-generation' }),
  ],
  exports: [BullModule],
})
export class GenerationModule {}
