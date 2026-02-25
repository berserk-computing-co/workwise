import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Option } from "../entities/option.entity.js";
import { UpdateOptionDto } from "../dto/update-option.dto.js";

@Injectable()
export class OptionsService {
  constructor(
    @InjectRepository(Option)
    private readonly optionRepo: Repository<Option>,
  ) {}

  async findAll(projectId: string): Promise<Option[]> {
    return this.optionRepo.findBy({ projectId });
  }

  async update(
    projectId: string,
    optionId: string,
    dto: UpdateOptionDto,
  ): Promise<Option> {
    const option = await this.optionRepo.findOne({ where: { id: optionId } });
    if (!option || option.projectId !== projectId) {
      throw new NotFoundException("Option not found");
    }
    Object.assign(option, dto);
    return this.optionRepo.save(option);
  }
}
