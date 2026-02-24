import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PipelineStep } from '../../common/pipeline/pipeline-step.interface.js';
import { AiService } from '../../ai/ai.service.js';
import type { GenerationContext } from '../generation-context.js';
import { getScopePrompt, buildUserPrompt } from '../prompts/scope-decomposition.prompt.js';

const scopeDecompositionSchema = z.object({
  project_type: z.string(),
  sections: z.array(z.object({
    name: z.string(),
    labor_hours: z.number(),
    items: z.array(z.object({
      description: z.string(),
      quantity: z.number(),
      unit: z.string(),
      unit_cost: z.number(),
    })),
  })),
  confidence: z.number().min(0).max(1),
});

@Injectable()
export class ScopeDecompositionStep implements PipelineStep<GenerationContext> {
  readonly name = 'scope_decomposition';

  constructor(private readonly aiService: AiService) {}

  async execute(context: GenerationContext): Promise<void> {
    const result = await this.aiService.generateObject({
      system: getScopePrompt(context.tradeCategory),
      prompt: buildUserPrompt(context),
      schema: scopeDecompositionSchema,
    });

    context.projectType = result.project_type;
    context.sections = result.sections.map(s => ({
      name: s.name,
      laborHours: s.labor_hours,
      items: s.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitCost: i.unit_cost,
      })),
    }));
  }
}
