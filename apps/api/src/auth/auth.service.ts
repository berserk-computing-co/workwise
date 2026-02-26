import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Organization } from '../users/entities/organization.entity.js';
import { AuthSetupDto } from './dto/auth-setup.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    private readonly dataSource: DataSource,
  ) {}

  async setup(authId: string, dto: AuthSetupDto) {
    const existingUser = await this.userRepository.findOne({
      where: { authId },
      relations: ['organization'],
    });

    if (existingUser) {
      return { user: existingUser, organization: existingUser.organization };
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const organization = manager.create(Organization, {
          name: dto.organization.name,
          zipCode: dto.organization.zipCode,
        });
        const savedOrganization = await manager.save(organization);

        const user = manager.create(User, {
          authId,
          email: dto.user.email,
          firstName: dto.user.firstName,
          lastName: dto.user.lastName,
          organizationId: savedOrganization.id,
        });
        const savedUser = await manager.save(user);

        return { user: savedUser, organization: savedOrganization };
      });
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code: string }).code === '23505'
      ) {
        const user = await this.userRepository.findOne({
          where: { authId },
          relations: ['organization'],
        });
        if (user) {
          return { user, organization: user.organization };
        }
      }
      throw err;
    }
  }
}
