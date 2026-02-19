import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estimate } from './entities/estimate.entity.js';
import { EstimateSection } from './entities/estimate-section.entity.js';
import { LineItem } from './entities/line-item.entity.js';
import { EstimateOption } from './entities/estimate-option.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Estimate,
      EstimateSection,
      LineItem,
      EstimateOption,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class EstimatesModule {}
