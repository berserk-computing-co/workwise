import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  async getMe(@CurrentUser() payload: JwtPayload) {
    return this.companiesService.findByAuthId(payload.sub);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(payload.sub, dto);
  }
}
