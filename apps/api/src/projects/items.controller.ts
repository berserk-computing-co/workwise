import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ItemsService } from './items.service.js';
import { ProjectsService } from './projects.service.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { ReorderItemsDto } from './dto/reorder-items.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';

@Controller('projects/:projectId/items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @CurrentUser() payload: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateItemDto,
  ) {
    await this.projectsService.findOne(payload.sub, projectId);
    return this.itemsService.create(projectId, dto);
  }

  @Patch(':itemId')
  async update(
    @CurrentUser() payload: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    await this.projectsService.findOne(payload.sub, projectId);
    return this.itemsService.update(projectId, itemId, dto);
  }

  @Delete(':itemId')
  @HttpCode(204)
  async remove(
    @CurrentUser() payload: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.projectsService.findOne(payload.sub, projectId);
    return this.itemsService.remove(projectId, itemId);
  }

  @Post('reorder')
  async reorder(
    @CurrentUser() payload: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: ReorderItemsDto,
  ) {
    await this.projectsService.findOne(payload.sub, projectId);
    return this.itemsService.reorder(projectId, dto);
  }
}
