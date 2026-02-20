import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstimateSection } from './entities/estimate-section.entity.js';
import { LineItem } from './entities/line-item.entity.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSectionDto } from './dto/update-section.dto.js';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(EstimateSection)
    private readonly sectionRepo: Repository<EstimateSection>,
    @InjectRepository(LineItem)
    private readonly lineItemRepo: Repository<LineItem>,
  ) {}

  async create(estimateId: string, dto: CreateSectionDto): Promise<EstimateSection> {
    const result = await this.sectionRepo
      .createQueryBuilder('s')
      .select('MAX(s.sort_order)', 'max')
      .where('s.estimate_id = :estimateId', { estimateId })
      .getRawOne<{ max: number | null }>();

    const sortOrder = result?.max !== null && result?.max !== undefined ? result.max + 1 : 0;

    const section = this.sectionRepo.create({
      estimateId,
      name: dto.name,
      sortOrder,
    });
    return this.sectionRepo.save(section);
  }

  async update(estimateId: string, sectionId: string, dto: UpdateSectionDto): Promise<EstimateSection> {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section || section.estimateId !== estimateId) {
      throw new NotFoundException('Section not found');
    }
    Object.assign(section, dto);
    return this.sectionRepo.save(section);
  }

  async remove(estimateId: string, sectionId: string): Promise<void> {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section || section.estimateId !== estimateId) {
      throw new NotFoundException('Section not found');
    }

    const orphans = await this.lineItemRepo.findBy({ sectionId });
    if (orphans.length > 0) {
      let otherSection = await this.sectionRepo.findOne({
        where: { estimateId, name: 'Other' },
      });
      if (!otherSection) {
        const result = await this.sectionRepo
          .createQueryBuilder('s')
          .select('MAX(s.sort_order)', 'max')
          .where('s.estimate_id = :estimateId', { estimateId })
          .getRawOne<{ max: number | null }>();
        const sortOrder = result?.max !== null && result?.max !== undefined ? result.max + 1 : 0;
        otherSection = await this.sectionRepo.save(
          this.sectionRepo.create({ estimateId, name: 'Other', sortOrder }),
        );
      }
      for (const item of orphans) {
        await this.lineItemRepo.update(item.id, { sectionId: otherSection.id });
      }
    }

    await this.sectionRepo.delete(sectionId);
  }
}
