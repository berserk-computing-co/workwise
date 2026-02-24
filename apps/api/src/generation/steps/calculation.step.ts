import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PipelineStep } from '../../common/pipeline/pipeline-step.interface.js';
import type { GenerationContext } from '../generation-context.js';
import { Estimate } from '../../estimates/entities/estimate.entity.js';
import { EstimateSection } from '../../estimates/entities/estimate-section.entity.js';
import { LineItem } from '../../estimates/entities/line-item.entity.js';
import { EstimateOption } from '../../estimates/entities/estimate-option.entity.js';

@Injectable()
export class CalculationStep implements PipelineStep<GenerationContext> {
  readonly name = 'calculation';

  constructor(private readonly dataSource: DataSource) {}

  async execute(context: GenerationContext): Promise<void> {
    const { companyRates } = context;

    const materialSubtotal = context.pricedItems!.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    const laborHours = context.sections!.reduce(
      (sum, section) => sum + section.laborHours,
      0,
    );

    const laborSubtotal =
      laborHours * companyRates.hourlyRate * companyRates.burdenMultiplier;
    const overheadAmount = laborSubtotal * companyRates.overheadMultiplier;
    const profitAmount =
      (materialSubtotal + laborSubtotal + overheadAmount) *
      companyRates.profitMargin;
    const taxAmount = materialSubtotal * companyRates.taxRate;
    const total =
      materialSubtotal + laborSubtotal + overheadAmount + profitAmount + taxAmount;

    for (const option of context.options!) {
      if (option.tier === 'better') {
        option.total = Math.round(total * 100) / 100;
      } else {
        const deltaSum = option.tierDetails.reduce(
          (sum, detail) => sum + detail.costDelta,
          0,
        );
        option.total = Math.round((total + deltaSum) * 100) / 100;
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(EstimateSection, { estimateId: context.estimateId });
      await manager.delete(EstimateOption, { estimateId: context.estimateId });

      let sectionOrder = 0;
      for (const section of context.sections!) {
        const sectionItems = context.pricedItems!.filter(
          (p) => p.sectionName === section.name,
        );

        const sectionSubtotal = sectionItems.reduce(
          (sum, item) => sum + item.quantity * item.unitCost,
          0,
        );

        const savedSection = await manager.save(EstimateSection, {
          estimateId: context.estimateId,
          name: section.name,
          sortOrder: sectionOrder++,
          laborHours: section.laborHours,
          subtotal: Math.round(sectionSubtotal * 100) / 100,
        });

        let itemOrder = 0;
        for (const item of sectionItems) {
          await manager.save(LineItem, {
            sectionId: savedSection.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            extendedCost: Math.round(item.quantity * item.unitCost * 100) / 100,
            sortOrder: itemOrder++,
            source: item.source,
            onebuildSourceId: item.onebuildSourceId ?? null,
            onebuildMatchScore: item.onebuildMatchScore ?? null,
            flagged: item.flagged,
            flagReason: item.flagReason ?? null,
          });
        }
      }

      for (const option of context.options!) {
        await manager.save(EstimateOption, {
          estimateId: context.estimateId,
          tier: option.tier,
          label: option.label,
          description: option.description,
          total: option.total,
          isRecommended: option.isRecommended,
          tierDetails: option.tierDetails,
        });
      }

      await manager.update(Estimate, context.estimateId, {
        status: 'generated',
        projectType: context.projectType,
        materialSubtotal: Math.round(materialSubtotal * 100) / 100,
        laborHours: Math.round(laborHours * 100) / 100,
        laborSubtotal: Math.round(laborSubtotal * 100) / 100,
        overheadAmount: Math.round(overheadAmount * 100) / 100,
        profitAmount: Math.round(profitAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
      });
    });

    context.totals = {
      materialSubtotal: Math.round(materialSubtotal * 100) / 100,
      laborHours: Math.round(laborHours * 100) / 100,
      laborSubtotal: Math.round(laborSubtotal * 100) / 100,
      overheadAmount: Math.round(overheadAmount * 100) / 100,
      profitAmount: Math.round(profitAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
}
