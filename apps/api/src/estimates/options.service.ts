import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstimateOption } from './entities/estimate-option.entity.js';
import { UpdateOptionDto } from './dto/update-option.dto.js';

@Injectable()
export class OptionsService {
  constructor(
    @InjectRepository(EstimateOption)
    private readonly optionRepo: Repository<EstimateOption>,
  ) {}

  async findAll(estimateId: string): Promise<EstimateOption[]> {
    return this.optionRepo.findBy({ estimateId });
  }

  async update(estimateId: string, optionId: string, dto: UpdateOptionDto): Promise<EstimateOption> {
    const option = await this.optionRepo.findOne({ where: { id: optionId } });
    if (!option || option.estimateId !== estimateId) {
      throw new NotFoundException('Option not found');
    }
    Object.assign(option, dto);
    return this.optionRepo.save(option);
  }
}
