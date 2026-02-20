import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Company } from './entities/company.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { CompaniesController } from './companies.controller.js';
import { CompaniesService } from './companies.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company])],
  controllers: [UsersController, CompaniesController],
  providers: [UsersService, CompaniesService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
