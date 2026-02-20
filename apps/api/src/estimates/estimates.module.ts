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
import { LineItemsService } from './line-items.service.js';
import { LineItemsController } from './line-items.controller.js';
import { SectionsService } from './sections.service.js';
import { OptionsService } from './options.service.js';
import { EditTrackerService } from './edit-tracker.service.js';
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
  controllers: [EstimatesController, LineItemsController],
  providers: [
    EstimatesService,
    LineItemsService,
    SectionsService,
    OptionsService,
    EditTrackerService,
  ],
  exports: [TypeOrmModule, EstimatesService],
})
export class EstimatesModule {}
