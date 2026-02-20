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
} from '@nestjs/common';
import { EstimatesService } from './estimates.service.js';
import { SectionsService } from './sections.service.js';
import { OptionsService } from './options.service.js';
import { CreateEstimateDto } from './dto/create-estimate.dto.js';
import { UpdateEstimateDto } from './dto/update-estimate.dto.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSectionDto } from './dto/update-section.dto.js';
import { UpdateOptionDto } from './dto/update-option.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';

@Controller('estimates')
export class EstimatesController {
  constructor(
    private readonly estimatesService: EstimatesService,
    private readonly sectionsService: SectionsService,
    private readonly optionsService: OptionsService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() payload: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.estimatesService.findAll(payload.sub, {
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
    @Body() dto: CreateEstimateDto,
  ) {
    return this.estimatesService.create(payload.sub, dto);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.estimatesService.findOne(payload.sub, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEstimateDto,
  ) {
    return this.estimatesService.update(payload.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async softDelete(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.estimatesService.softDelete(payload.sub, id);
  }

  @Post(':id/duplicate')
  @HttpCode(201)
  async duplicate(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.estimatesService.duplicate(payload.sub, id);
  }

  @Post(':id/recalculate')
  async recalculate(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.estimatesService.recalculate(payload.sub, id);
  }

  @Post(':id/sections')
  @HttpCode(201)
  async createSection(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateSectionDto,
  ) {
    await this.estimatesService.findOne(payload.sub, id);
    return this.sectionsService.create(id, dto);
  }

  @Patch(':id/sections/:sectionId')
  async updateSection(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    await this.estimatesService.findOne(payload.sub, id);
    return this.sectionsService.update(id, sectionId, dto);
  }

  @Delete(':id/sections/:sectionId')
  @HttpCode(204)
  async removeSection(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
  ) {
    await this.estimatesService.findOne(payload.sub, id);
    return this.sectionsService.remove(id, sectionId);
  }

  @Get(':id/options')
  async findOptions(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.estimatesService.findOne(payload.sub, id);
    return this.optionsService.findAll(id);
  }

  @Patch(':id/options/:optionId')
  async updateOption(
    @CurrentUser() payload: JwtPayload,
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateOptionDto,
  ) {
    await this.estimatesService.findOne(payload.sub, id);
    return this.optionsService.update(id, optionId, dto);
  }
}
