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
import { CreateEstimateDto } from './dto/create-estimate.dto.js';
import { UpdateEstimateDto } from './dto/update-estimate.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';

@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

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
}
