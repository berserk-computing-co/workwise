import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity.js';
import { User } from './entities/user.entity.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByAuthId(authId: string): Promise<Company> {
    const user = await this.userRepository.findOne({ where: { auth0Id: authId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const company = await this.companyRepository.findOne({ where: { id: user.companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(authId: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findByAuthId(authId);
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }
}
