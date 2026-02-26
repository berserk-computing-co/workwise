import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ProjectsService } from "../services/projects.service.js";
import { SectionsService } from "../services/sections.service.js";
import { OptionsService } from "../services/options.service.js";
import { CreateProjectDto } from "../dto/create-project.dto.js";
import { UpdateProjectDto } from "../dto/update-project.dto.js";
import { CreateSectionDto } from "../dto/create-section.dto.js";
import { UpdateSectionDto } from "../dto/update-section.dto.js";
import { UpdateOptionDto } from "../dto/update-option.dto.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { JwtPayload } from "../../common/decorators/current-user.decorator.js";

@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly sectionsService: SectionsService,
    private readonly optionsService: OptionsService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() payload: JwtPayload,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: string,
  ) {
    return this.projectsService.findAll(payload.sub, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sort,
    });
  }

  @Post()
  @HttpCode(201)
  async create(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(payload.sub, dto);
  }

  @Get(":id")
  async findOne(@CurrentUser() payload: JwtPayload, @Param("id") id: string) {
    return this.projectsService.findOne(payload.sub, id);
  }

  @Patch(":id")
  async update(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(payload.sub, id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async softDelete(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
  ) {
    return this.projectsService.softDelete(payload.sub, id);
  }

  @Post(":id/duplicate")
  @HttpCode(201)
  async duplicate(@CurrentUser() payload: JwtPayload, @Param("id") id: string) {
    return this.projectsService.duplicate(payload.sub, id);
  }

  @Post(":id/recalculate")
  async recalculate(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
  ) {
    await this.projectsService.findOne(payload.sub, id);
    return this.projectsService.recalculate(id);
  }

  @Post(":id/sections")
  @HttpCode(201)
  async createSection(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
    @Body() dto: CreateSectionDto,
  ) {
    await this.projectsService.findOne(payload.sub, id);
    return this.sectionsService.create(id, dto);
  }

  @Patch(":id/sections/:sectionId")
  async updateSection(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    await this.projectsService.findOne(payload.sub, id);
    return this.sectionsService.update(id, sectionId, dto);
  }

  @Delete(":id/sections/:sectionId")
  @HttpCode(204)
  async removeSection(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
    @Param("sectionId") sectionId: string,
  ) {
    await this.projectsService.findOne(payload.sub, id);
    return this.sectionsService.remove(id, sectionId);
  }

  @Get(":id/options")
  async findOptions(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
  ) {
    await this.projectsService.findOne(payload.sub, id);
    return this.optionsService.findAll(id);
  }

  @Patch(":id/options/:optionId")
  async updateOption(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
    @Param("optionId") optionId: string,
    @Body() dto: UpdateOptionDto,
  ) {
    await this.projectsService.findOne(payload.sub, id);
    return this.optionsService.update(id, optionId, dto);
  }
}
