import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estimate } from './entities/estimate.entity.js';
import { EstimateSection } from './entities/estimate-section.entity.js';
import { LineItem } from './entities/line-item.entity.js';
import { EstimateOption } from './entities/estimate-option.entity.js';
import { LineItemEdit } from './entities/line-item-edit.entity.js';
import { Company } from '../users/entities/company.entity.js';
import { EstimatesService } from './estimates.service.js';
import { EstimatesController } from './estimates.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Estimate,
      EstimateSection,
      LineItem,
      EstimateOption,
      LineItemEdit,
      Company,
    ]),
    UsersModule,
  ],
  controllers: [EstimatesController],
  providers: [EstimatesService],
  exports: [TypeOrmModule, EstimatesService],
})
export class EstimatesModule {}
