import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineItem } from './entities/line-item.entity.js';
import { EstimateSection } from './entities/estimate-section.entity.js';
import { Estimate } from './entities/estimate.entity.js';
import { EditTrackerService } from './edit-tracker.service.js';
import { CreateLineItemDto } from './dto/create-line-item.dto.js';
import { UpdateLineItemDto } from './dto/update-line-item.dto.js';
import { ReorderLineItemsDto } from './dto/reorder-line-items.dto.js';

@Injectable()
export class LineItemsService {
  constructor(
    @InjectRepository(LineItem)
    private readonly lineItemRepo: Repository<LineItem>,
    @InjectRepository(EstimateSection)
    private readonly sectionRepo: Repository<EstimateSection>,
    @InjectRepository(Estimate)
    private readonly estimateRepo: Repository<Estimate>,
    private readonly editTrackerService: EditTrackerService,
  ) {}

  async create(estimateId: string, dto: CreateLineItemDto, userId: string): Promise<LineItem> {
    const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId } });
    if (!section || section.estimateId !== estimateId) {
      throw new NotFoundException('Section not found');
    }

    const item = this.lineItemRepo.create({
      sectionId: dto.sectionId,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitCost: dto.unitCost,
      extendedCost: dto.quantity * dto.unitCost,
      source: 'manual',
    });
    const saved = await this.lineItemRepo.save(item);

    await this.editTrackerService.trackEdit({
      estimateId,
      lineItemId: saved.id,
      userId,
      editType: 'create',
      newValue: {
        description: dto.description,
        quantity: dto.quantity,
        unit: dto.unit,
        unitCost: dto.unitCost,
      },
    });

    await this.recalculateFromItem(saved.sectionId, estimateId);
    return saved;
  }

  async update(estimateId: string, itemId: string, dto: UpdateLineItemDto, userId: string): Promise<LineItem> {
    const item = await this.lineItemRepo.findOne({
      where: { id: itemId },
      relations: ['section'],
    });
    if (!item || item.section.estimateId !== estimateId) {
      throw new NotFoundException('Line item not found');
    }

    const previousValue: Record<string, unknown> = {
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitCost: item.unitCost,
      isOptional: item.isOptional,
    };

    const oldSectionId = item.sectionId;
    Object.assign(item, dto);

    if (dto.quantity !== undefined || dto.unitCost !== undefined) {
      item.extendedCost = Number(item.quantity) * Number(item.unitCost);
    }
    item.contractorModified = true;

    const saved = await this.lineItemRepo.save(item);

    await this.editTrackerService.trackEdit({
      estimateId,
      lineItemId: saved.id,
      userId,
      editType: 'update',
      previousValue,
      newValue: dto as Record<string, unknown>,
    });

    if (dto.sectionId && dto.sectionId !== oldSectionId) {
      await this.recalculateFromItem(oldSectionId, estimateId);
    }

    await this.recalculateFromItem(saved.sectionId, estimateId);
    return saved;
  }

  async remove(estimateId: string, itemId: string, userId: string): Promise<void> {
    const item = await this.lineItemRepo.findOne({
      where: { id: itemId },
      relations: ['section'],
    });
    if (!item || item.section.estimateId !== estimateId) {
      throw new NotFoundException('Line item not found');
    }

    await this.editTrackerService.trackEdit({
      estimateId,
      lineItemId: item.id,
      userId,
      editType: 'delete',
      previousValue: {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
      },
    });

    const sectionId = item.sectionId;
    await this.lineItemRepo.delete(item.id);
    await this.recalculateFromItem(sectionId, estimateId);
  }

  async reorder(estimateId: string, dto: ReorderLineItemsDto): Promise<{ updated: number }> {
    for (let index = 0; index < dto.itemIds.length; index++) {
      await this.lineItemRepo.update(dto.itemIds[index], { sortOrder: index });
    }
    return { updated: dto.itemIds.length };
  }

  private async recalculateFromItem(sectionId: string, estimateId: string): Promise<void> {
    const items = await this.lineItemRepo.findBy({ sectionId });
    const subtotal = items.reduce((sum, item) => sum + Number(item.extendedCost), 0);
    await this.sectionRepo.update(sectionId, { subtotal });

    const sections = await this.sectionRepo.findBy({ estimateId });
    const materialSubtotal = sections.reduce((sum, s) => sum + Number(s.subtotal), 0);
    const laborHours = sections.reduce((sum, s) => sum + Number(s.laborHours), 0);
    await this.estimateRepo.update(estimateId, { materialSubtotal, laborHours });
  }
}
