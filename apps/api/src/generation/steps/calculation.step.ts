import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PipelineStep } from '../../pipeline/pipeline-step.interface.js';
import type { GenerationContext } from '../generation-context.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Section } from '../../projects/entities/section.entity.js';
import { Item } from '../../projects/entities/item.entity.js';
import { Option } from '../../projects/entities/option.entity.js';

@Injectable()
export class CalculationStep implements PipelineStep<GenerationContext> {
  readonly name = 'calculation';

  constructor(private readonly dataSource: DataSource) {}

  async execute(context: GenerationContext): Promise<void> {
    const total = context.pricedItems!.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Section, { projectId: context.projectId });
      await manager.delete(Option, { projectId: context.projectId });

      let sectionOrder = 0;
      for (const section of context.sections!) {
        const sectionItems = context.pricedItems!.filter(
          (p) => p.sectionName === section.name,
        );

        const sectionSubtotal = sectionItems.reduce(
          (sum, item) => sum + item.quantity * item.unitCost,
          0,
        );

        const savedSection = await manager.save(Section, {
          projectId: context.projectId,
          name: section.name,
          sortOrder: sectionOrder++,
          subtotal: Math.round(sectionSubtotal * 100) / 100,
        });

        let itemOrder = 0;
        for (const item of sectionItems) {
          await manager.save(Item, {
            sectionId: savedSection.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            extendedCost: Math.round(item.quantity * item.unitCost * 100) / 100,
            sortOrder: itemOrder++,
            source: item.source,
            sourceData: item.sourceData ?? {},
          });
        }
      }

      for (const option of context.options!) {
        await manager.save(Option, {
          projectId: context.projectId,
          tier: option.tier,
          label: option.label,
          description: option.description,
          total: option.total,
          isRecommended: option.isRecommended,
          overrides: option.overrides,
        });
      }

      await manager.update(Project, context.projectId, {
        status: 'generated',
        total: Math.round(total * 100) / 100,
      });
    });

    context.totals = {
      total: Math.round(total * 100) / 100,
    };
  }
}
