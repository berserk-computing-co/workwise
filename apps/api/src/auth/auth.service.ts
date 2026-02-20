import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Company } from '../users/entities/company.entity.js';
import { AuthSetupDto } from './dto/auth-setup.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly dataSource: DataSource,
  ) {}

  async setup(authId: string, dto: AuthSetupDto) {
    // Idempotent: if user already exists, return existing records
    const existingUser = await this.userRepository.findOne({
      where: { auth0Id: authId },
      relations: ['company'],
    });

    if (existingUser) {
      return { user: existingUser, company: existingUser.company };
    }

    // Create company + user in a transaction
    // Catch unique constraint violations (concurrent double-submit) and return existing records
    try {
      return await this.dataSource.transaction(async (manager) => {
        const company = manager.create(Company, {
          name: dto.company.name,
          zipCode: dto.company.zipCode,
          phone: dto.company.phone ?? null,
          email: dto.company.email ?? null,
          hourlyRate: dto.company.hourlyRate ?? 85.0,
          burdenMultiplier: dto.company.burdenMultiplier ?? 1.5,
          overheadMultiplier: dto.company.overheadMultiplier ?? 1.25,
          profitMargin: dto.company.profitMargin ?? 0.2,
          taxRate: dto.company.taxRate ?? 0.0,
        });
        const savedCompany = await manager.save(company);

        const user = manager.create(User, {
          auth0Id: authId,
          email: dto.user.email,
          firstName: dto.user.firstName,
          lastName: dto.user.lastName,
          companyId: savedCompany.id,
        });
        const savedUser = await manager.save(user);

        return { user: savedUser, company: savedCompany };
      });
    } catch (err: unknown) {
      // Handle concurrent double-submit (unique constraint on auth0_id)
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
        const user = await this.userRepository.findOne({
          where: { auth0Id: authId },
          relations: ['company'],
        });
        if (user) {
          return { user, company: user.company };
        }
      }
      throw err;
    }
  }
}
