import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Estimate } from './entities/estimate.entity.js';
import { EstimateSection } from './entities/estimate-section.entity.js';
import { LineItem } from './entities/line-item.entity.js';
import { EstimateOption } from './entities/estimate-option.entity.js';
import { Company } from '../users/entities/company.entity.js';
import { UsersService } from '../users/users.service.js';
import { CreateEstimateDto } from './dto/create-estimate.dto.js';
import { UpdateEstimateDto } from './dto/update-estimate.dto.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  generated: ['sent', 'draft'],
  sent: ['accepted', 'declined', 'draft'],
  accepted: ['draft'],
  declined: ['draft'],
  draft: [],
};

@Injectable()
export class EstimatesService {
  constructor(
    @InjectRepository(Estimate)
    private readonly estimateRepository: Repository<Estimate>,
    @InjectRepository(EstimateSection)
    private readonly sectionRepository: Repository<EstimateSection>,
    @InjectRepository(LineItem)
    private readonly lineItemRepository: Repository<LineItem>,
    @InjectRepository(EstimateOption)
    private readonly optionRepository: Repository<EstimateOption>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly usersService: UsersService,
  ) {}

  async create(authId: string, dto: CreateEstimateDto): Promise<Estimate> {
    const user = await this.usersService.findByAuthIdOrFail(authId);
    const estimate = this.estimateRepository.create({
      ...dto,
      companyId: user.companyId,
      createdBy: user.id,
      status: 'draft',
    });
    return this.estimateRepository.save(estimate);
  }

  async findAll(
    authId: string,
    query: { status?: string; page?: number; limit?: number; sort?: string },
  ): Promise<{ data: Partial<Estimate>[]; meta: { total: number; page: number; limit: number; pages: number } }> {
    const user = await this.usersService.findByAuthIdOrFail(authId);
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      deletedAt: IsNull(),
    };
    if (query.status) {
      where['status'] = query.status;
    }

    const [rows, total] = await this.estimateRepository.findAndCount({
      where,
      select: {
        id: true,
        companyId: true,
        createdBy: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        jobSiteAddress: true,
        projectDescription: true,
        tradeCategory: true,
        propertyType: true,
        zipCode: true,
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

  async findOne(authId: string, id: string): Promise<Estimate> {
    const { estimate } = await this.verifyOwnership(authId, id);
    const full = await this.estimateRepository.findOne({
      where: { id },
      relations: ['sections', 'sections.lineItems', 'options'],
      order: {
        sections: {
          sortOrder: 'ASC',
          lineItems: {
            sortOrder: 'ASC',
          },
        },
      },
    });
    if (!full) throw new NotFoundException('Estimate not found');
    return full;
  }

  async update(authId: string, id: string, dto: UpdateEstimateDto): Promise<Estimate> {
    const { estimate } = await this.verifyOwnership(authId, id);

    if (dto.status && dto.status !== estimate.status) {
      if (dto.status === 'generated') {
        throw new ForbiddenException('Status cannot be set to generated directly; use the generate endpoint');
      }
      const allowed = VALID_TRANSITIONS[estimate.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new ForbiddenException(`Invalid status transition from ${estimate.status} to ${dto.status}`);
      }
    }

    Object.assign(estimate, dto);
    return this.estimateRepository.save(estimate);
  }

  async softDelete(authId: string, id: string): Promise<void> {
    const { estimate } = await this.verifyOwnership(authId, id);
    estimate.deletedAt = new Date();
    await this.estimateRepository.save(estimate);
  }

  async duplicate(authId: string, id: string): Promise<Estimate> {
    const { estimate } = await this.verifyOwnership(authId, id);

    const full = await this.estimateRepository.findOne({
      where: { id },
      relations: ['sections', 'sections.lineItems'],
    });
    if (!full) throw new NotFoundException('Estimate not found');

    const newEstimate = this.estimateRepository.create({
      companyId: full.companyId,
      createdBy: full.createdBy,
      status: 'draft',
      projectDescription: full.projectDescription,
      jobSiteAddress: full.jobSiteAddress,
      zipCode: full.zipCode,
      tradeCategory: full.tradeCategory,
      propertyType: full.propertyType,
      customerName: full.customerName,
      customerEmail: full.customerEmail,
      customerPhone: full.customerPhone,
      internalNotes: full.internalNotes,
      customerNotes: full.customerNotes,
      materialSubtotal: 0,
      laborHours: 0,
      laborSubtotal: 0,
      overheadAmount: 0,
      profitAmount: 0,
      taxAmount: 0,
      total: 0,
    });
    const savedEstimate = await this.estimateRepository.save(newEstimate);

    for (const section of full.sections) {
      const newSection = this.sectionRepository.create({
        estimateId: savedEstimate.id,
        name: section.name,
        sortOrder: section.sortOrder,
        laborHours: 0,
        subtotal: 0,
      });
      const savedSection = await this.sectionRepository.save(newSection);

      for (const item of section.lineItems) {
        const newItem = this.lineItemRepository.create({
          sectionId: savedSection.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          extendedCost: item.extendedCost,
          sortOrder: item.sortOrder,
          source: item.source,
          isOptional: item.isOptional,
        });
        await this.lineItemRepository.save(newItem);
      }
    }

    return this.findOne(authId, savedEstimate.id);
  }

  async recalculate(authId: string, id: string): Promise<Estimate> {
    const { estimate, user } = await this.verifyOwnership(authId, id);

    const company = await this.companyRepository.findOne({ where: { id: user.companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const full = await this.estimateRepository.findOne({
      where: { id },
      relations: ['sections', 'sections.lineItems'],
    });
    if (!full) throw new NotFoundException('Estimate not found');

    let materialSubtotal = 0;
    let laborHours = 0;

    for (const section of full.sections) {
      for (const item of section.lineItems) {
        materialSubtotal += Number(item.quantity) * Number(item.unitCost);
      }
      laborHours += Number(section.laborHours);
    }

    const laborSubtotal = laborHours * Number(company.hourlyRate) * Number(company.burdenMultiplier);
    const overheadAmount = laborSubtotal * Number(company.overheadMultiplier);
    const profitAmount = (materialSubtotal + laborSubtotal + overheadAmount) * Number(company.profitMargin);
    const taxRate = estimate.taxRate ?? Number(company.taxRate);
    const taxAmount = materialSubtotal * taxRate;
    const total = materialSubtotal + laborSubtotal + overheadAmount + profitAmount + taxAmount;

    Object.assign(estimate, {
      materialSubtotal,
      laborHours,
      laborSubtotal,
      overheadAmount,
      profitAmount,
      taxAmount,
      total,
      taxRate,
    });

    return this.estimateRepository.save(estimate);
  }

  private async verifyOwnership(
    authId: string,
    estimateId: string,
  ): Promise<{ user: Awaited<ReturnType<UsersService['findByAuthIdOrFail']>>; estimate: Estimate }> {
    const user = await this.usersService.findByAuthIdOrFail(authId);
    const estimate = await this.estimateRepository.findOne({
      where: { id: estimateId, deletedAt: IsNull() },
    });
    if (!estimate) throw new NotFoundException('Estimate not found');
    if (estimate.companyId !== user.companyId) {
      throw new ForbiddenException('Access denied');
    }
    return { user, estimate };
  }
}
