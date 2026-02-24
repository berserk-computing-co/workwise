import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { Section } from './entities/section.entity.js';
import { Item } from './entities/item.entity.js';
import { Option } from './entities/option.entity.js';
import { UsersService } from '../users/users.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  generating: ['review', 'draft'],
  review: ['sent', 'draft'],
  sent: ['accepted', 'rejected', 'draft'],
  accepted: ['draft'],
  rejected: ['draft'],
  draft: [],
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Option)
    private readonly optionRepo: Repository<Option>,
    private readonly usersService: UsersService,
  ) {}

  async create(authId: string, dto: CreateProjectDto): Promise<Project> {
    const user = await this.usersService.findByAuthIdOrFail(authId);
    const project = this.projectRepo.create({
      ...dto,
      organizationId: user.organizationId,
      createdBy: user.id,
      status: 'draft',
    });
    return this.projectRepo.save(project);
  }

  async findAll(
    authId: string,
    query: { status?: string; page?: number; limit?: number; sort?: string },
  ): Promise<{ data: Partial<Project>[]; meta: { total: number; page: number; limit: number; pages: number } }> {
    const user = await this.usersService.findByAuthIdOrFail(authId);
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
      deletedAt: IsNull(),
    };
    if (query.status) {
      where['status'] = query.status;
    }

    const [rows, total] = await this.projectRepo.findAndCount({
      where,
      select: {
        id: true,
        organizationId: true,
        createdBy: true,
        status: true,
        description: true,
        category: true,
        address: true,
        zipCode: true,
        clientName: true,
        total: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(authId: string, id: string): Promise<Project> {
    await this.verifyOwnership(authId, id);
    const full = await this.projectRepo.findOne({
      where: { id },
      relations: ['sections', 'sections.items', 'options'],
      order: {
        sections: {
          sortOrder: 'ASC',
          items: {
            sortOrder: 'ASC',
          },
        },
      },
    });
    if (!full) throw new NotFoundException('Project not found');
    return full;
  }

  async update(authId: string, id: string, dto: UpdateProjectDto): Promise<Project> {
    const { project } = await this.verifyOwnership(authId, id);

    if (dto.status && dto.status !== project.status) {
      if (dto.status === 'generating') {
        throw new ForbiddenException('Status cannot be set to generating directly; use the generate endpoint');
      }
      const allowed = VALID_TRANSITIONS[project.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new ForbiddenException(`Invalid status transition from ${project.status} to ${dto.status}`);
      }
    }

    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async softDelete(authId: string, id: string): Promise<void> {
    const { project } = await this.verifyOwnership(authId, id);
    project.deletedAt = new Date();
    await this.projectRepo.save(project);
  }

  async duplicate(authId: string, id: string): Promise<Project> {
    await this.verifyOwnership(authId, id);

    const full = await this.projectRepo.findOne({
      where: { id },
      relations: ['sections', 'sections.items'],
    });
    if (!full) throw new NotFoundException('Project not found');

    const newProject = this.projectRepo.create({
      organizationId: full.organizationId,
      createdBy: full.createdBy,
      status: 'draft',
      description: full.description,
      address: full.address,
      zipCode: full.zipCode,
      category: full.category,
      clientName: full.clientName,
      total: 0,
    });
    const savedProject = await this.projectRepo.save(newProject);

    for (const section of full.sections) {
      const newSection = this.sectionRepo.create({
        projectId: savedProject.id,
        name: section.name,
        sortOrder: section.sortOrder,
        subtotal: 0,
      });
      const savedSection = await this.sectionRepo.save(newSection);

      for (const item of section.items) {
        const newItem = this.itemRepo.create({
          sectionId: savedSection.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          extendedCost: item.extendedCost,
          sortOrder: item.sortOrder,
          source: item.source,
        });
        await this.itemRepo.save(newItem);
      }
    }

    return this.findOne(authId, savedProject.id);
  }

  async recalculate(projectId: string): Promise<Project> {
    const sections = await this.sectionRepo.find({ where: { projectId } });

    for (const section of sections) {
      const items = await this.itemRepo.find({ where: { sectionId: section.id } });
      section.subtotal = items.reduce((sum, i) => sum + Number(i.extendedCost), 0);
      await this.sectionRepo.save(section);
    }

    const total = sections.reduce((sum, s) => sum + Number(s.subtotal), 0);
    await this.projectRepo.update(projectId, { total });
    return this.projectRepo.findOneOrFail({ where: { id: projectId } });
  }

  private async verifyOwnership(
    authId: string,
    projectId: string,
  ): Promise<{ user: Awaited<ReturnType<UsersService['findByAuthIdOrFail']>>; project: Project }> {
    const user = await this.usersService.findByAuthIdOrFail(authId);
    const project = await this.projectRepo.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied');
    }
    return { user, project };
  }
}
