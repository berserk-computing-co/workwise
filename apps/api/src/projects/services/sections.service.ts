import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Section } from "../entities/section.entity.js";
import { Item } from "../entities/item.entity.js";
import { CreateSectionDto } from "../dto/create-section.dto.js";
import { UpdateSectionDto } from "../dto/update-section.dto.js";

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
  ) {}

  async create(projectId: string, dto: CreateSectionDto): Promise<Section> {
    const result = await this.sectionRepo
      .createQueryBuilder("s")
      .select("MAX(s.sort_order)", "max")
      .where("s.project_id = :projectId", { projectId })
      .getRawOne<{ max: number | null }>();

    const sortOrder =
      result?.max !== null && result?.max !== undefined ? result.max + 1 : 0;

    const section = this.sectionRepo.create({
      projectId,
      name: dto.name,
      sortOrder,
    });
    return this.sectionRepo.save(section);
  }

  async update(
    projectId: string,
    sectionId: string,
    dto: UpdateSectionDto,
  ): Promise<Section> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
    });
    if (!section || section.projectId !== projectId) {
      throw new NotFoundException("Section not found");
    }
    Object.assign(section, dto);
    return this.sectionRepo.save(section);
  }

  async remove(projectId: string, sectionId: string): Promise<void> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
    });
    if (!section || section.projectId !== projectId) {
      throw new NotFoundException("Section not found");
    }

    const orphans = await this.itemRepo.findBy({ sectionId });
    if (orphans.length > 0) {
      let otherSection = await this.sectionRepo.findOne({
        where: { projectId, name: "Other" },
      });
      if (!otherSection) {
        const result = await this.sectionRepo
          .createQueryBuilder("s")
          .select("MAX(s.sort_order)", "max")
          .where("s.project_id = :projectId", { projectId })
          .getRawOne<{ max: number | null }>();
        const sortOrder =
          result?.max !== null && result?.max !== undefined
            ? result.max + 1
            : 0;
        otherSection = await this.sectionRepo.save(
          this.sectionRepo.create({ projectId, name: "Other", sortOrder }),
        );
      }
      for (const item of orphans) {
        await this.itemRepo.update(item.id, { sectionId: otherSection.id });
      }
    }

    await this.sectionRepo.delete(sectionId);
  }
}
