import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity.js';
import { Section } from './entities/section.entity.js';
import { Project } from './entities/project.entity.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { ReorderItemsDto } from './dto/reorder-items.dto.js';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async create(projectId: string, dto: CreateItemDto): Promise<Item> {
    const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId } });
    if (!section || section.projectId !== projectId) {
      throw new NotFoundException('Section not found');
    }

    const item = this.itemRepo.create({
      sectionId: dto.sectionId,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitCost: dto.unitCost,
      extendedCost: dto.quantity * dto.unitCost,
      source: 'manual',
    });
    const saved = await this.itemRepo.save(item);

    await this.recalculateFromItem(saved.sectionId, projectId);
    return saved;
  }

  async update(projectId: string, itemId: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
      relations: ['section'],
    });
    if (!item || item.section.projectId !== projectId) {
      throw new NotFoundException('Item not found');
    }

    Object.assign(item, dto);

    if (dto.quantity !== undefined || dto.unitCost !== undefined) {
      item.extendedCost = Number(item.quantity) * Number(item.unitCost);
    }

    const saved = await this.itemRepo.save(item);
    await this.recalculateFromItem(saved.sectionId, projectId);
    return saved;
  }

  async remove(projectId: string, itemId: string): Promise<void> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
      relations: ['section'],
    });
    if (!item || item.section.projectId !== projectId) {
      throw new NotFoundException('Item not found');
    }

    const sectionId = item.sectionId;
    await this.itemRepo.delete(item.id);
    await this.recalculateFromItem(sectionId, projectId);
  }

  async reorder(projectId: string, dto: ReorderItemsDto): Promise<{ updated: number }> {
    for (let index = 0; index < dto.itemIds.length; index++) {
      await this.itemRepo.update(dto.itemIds[index], { sortOrder: index });
    }
    return { updated: dto.itemIds.length };
  }

  private async recalculateFromItem(sectionId: string, projectId: string): Promise<void> {
    const items = await this.itemRepo.findBy({ sectionId });
    const subtotal = items.reduce((sum, item) => sum + Number(item.extendedCost), 0);
    await this.sectionRepo.update(sectionId, { subtotal });

    const sections = await this.sectionRepo.findBy({ projectId });
    const total = sections.reduce((sum, s) => sum + Number(s.subtotal), 0);
    await this.projectRepo.update(projectId, { total });
  }
}
