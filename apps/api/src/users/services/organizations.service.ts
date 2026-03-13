import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity.js';
import { User } from '../entities/user.entity.js';
import { UpdateOrganizationDto } from '../dto/update-organization.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByAuthId(authId: string): Promise<Organization> {
    const user = await this.userRepo.findOne({ where: { authId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organization = await this.organizationRepo.findOne({
      where: { id: user.organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(
    authId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.findByAuthId(authId);
    Object.assign(organization, dto);
    return this.organizationRepo.save(organization);
  }

  async uploadLogo(
    authId: string,
    file: Express.Multer.File,
  ): Promise<{ logoUrl: string }> {
    const organization = await this.findByAuthId(authId);
    const base64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;
    organization.logoUrl = dataUri;
    await this.organizationRepo.save(organization);
    return { logoUrl: dataUri };
  }
}
