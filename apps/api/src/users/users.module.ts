import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Organization } from './entities/organization.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization])],
  controllers: [UsersController, OrganizationsController],
  providers: [UsersService, OrganizationsService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
