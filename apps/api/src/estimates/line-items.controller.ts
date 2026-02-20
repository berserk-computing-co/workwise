import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { LineItemsService } from './line-items.service.js';
import { EstimatesService } from './estimates.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateLineItemDto } from './dto/create-line-item.dto.js';
import { UpdateLineItemDto } from './dto/update-line-item.dto.js';
import { ReorderLineItemsDto } from './dto/reorder-line-items.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';

@Controller('estimates/:estimateId/line-items')
export class LineItemsController {
  constructor(
    private readonly lineItemsService: LineItemsService,
    private readonly estimatesService: EstimatesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @CurrentUser() payload: JwtPayload,
    @Param('estimateId') estimateId: string,
    @Body() dto: CreateLineItemDto,
  ) {
    await this.estimatesService.findOne(payload.sub, estimateId);
    const user = await this.usersService.findByAuthIdOrFail(payload.sub);
    return this.lineItemsService.create(estimateId, dto, user.id);
  }

  @Patch(':itemId')
  async update(
    @CurrentUser() payload: JwtPayload,
    @Param('estimateId') estimateId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateLineItemDto,
  ) {
    await this.estimatesService.findOne(payload.sub, estimateId);
    const user = await this.usersService.findByAuthIdOrFail(payload.sub);
    return this.lineItemsService.update(estimateId, itemId, dto, user.id);
  }

  @Delete(':itemId')
  @HttpCode(204)
  async remove(
    @CurrentUser() payload: JwtPayload,
    @Param('estimateId') estimateId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.estimatesService.findOne(payload.sub, estimateId);
    const user = await this.usersService.findByAuthIdOrFail(payload.sub);
    return this.lineItemsService.remove(estimateId, itemId, user.id);
  }

  @Post('reorder')
  async reorder(
    @CurrentUser() payload: JwtPayload,
    @Param('estimateId') estimateId: string,
    @Body() dto: ReorderLineItemsDto,
  ) {
    await this.estimatesService.findOne(payload.sub, estimateId);
    return this.lineItemsService.reorder(estimateId, dto);
  }
}
