import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity.js';
import { Section } from './entities/section.entity.js';
import { Item } from './entities/item.entity.js';
import { Option } from './entities/option.entity.js';
import { Pipeline } from './entities/pipeline.entity.js';
import { ProjectsService } from './projects.service.js';
import { ProjectsController } from './projects.controller.js';
import { ItemsService } from './items.service.js';
import { ItemsController } from './items.controller.js';
import { SectionsService } from './sections.service.js';
import { OptionsService } from './options.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Section, Item, Option, Pipeline]),
    UsersModule,
  ],
  controllers: [ProjectsController, ItemsController],
  providers: [ProjectsService, ItemsService, SectionsService, OptionsService],
  exports: [TypeOrmModule, ProjectsService],
})
export class ProjectsModule {}
