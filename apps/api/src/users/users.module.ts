import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Company } from './entities/company.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
