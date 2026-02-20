import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineItemEdit } from './entities/line-item-edit.entity.js';

@Injectable()
export class EditTrackerService {
  constructor(
    @InjectRepository(LineItemEdit)
    private readonly editRepository: Repository<LineItemEdit>,
  ) {}

  async trackEdit(params: {
    estimateId: string;
    lineItemId?: string;
    userId: string;
    editType: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    sectionName?: string;
    projectType?: string;
    zipCode?: string;
  }): Promise<void> {
    await this.editRepository.save({
      estimateId: params.estimateId,
      lineItemId: params.lineItemId ?? null,
      userId: params.userId,
      editType: params.editType,
      previousValue: params.previousValue ?? null,
      newValue: params.newValue ?? null,
      sectionName: params.sectionName ?? null,
      projectType: params.projectType ?? null,
      zipCode: params.zipCode ?? null,
    });
  }
}
