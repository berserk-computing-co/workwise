import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./entities/project.entity.js";
import { Section } from "./entities/section.entity.js";
import { Item } from "./entities/item.entity.js";
import { Option } from "./entities/option.entity.js";
import { ProjectsService } from "./services/projects.service.js";
import { ItemsService } from "./services/items.service.js";
import { SectionsService } from "./services/sections.service.js";
import { OptionsService } from "./services/options.service.js";
import { ProjectsController } from "./controllers/projects.controller.js";
import { ItemsController } from "./controllers/items.controller.js";
import { UsersModule } from "../users/users.module.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Section, Item, Option]),
    UsersModule,
  ],
  controllers: [ProjectsController, ItemsController],
  providers: [ProjectsService, ItemsService, SectionsService, OptionsService],
  exports: [TypeOrmModule, ProjectsService],
})
export class ProjectsModule {}
