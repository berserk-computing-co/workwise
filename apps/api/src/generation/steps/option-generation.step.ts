import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PipelineStep } from '../../common/pipeline/pipeline-step.interface.js';
import { AiService } from '../../ai/ai.service.js';
import type { GenerationContext, EstimateOptionData } from '../generation-context.js';
import { optionGenerationPrompt, buildOptionPrompt } from '../prompts/option-generation.prompt.js';

const optionGenerationSchema = z.object({
  options: z.array(z.object({
    tier: z.enum(['good', 'better', 'best']),
    label: z.string(),
    description: z.string(),
    total: z.number(),
    is_recommended: z.boolean(),
    tier_details: z.array(z.object({
      change: z.string(),
      cost_delta: z.number(),
    })),
  })).length(3),
});

@Injectable()
export class OptionGenerationStep implements PipelineStep<GenerationContext> {
  readonly name = 'option_generation';

  constructor(private readonly aiService: AiService) {}

  async execute(context: GenerationContext): Promise<void> {
    const result = await this.aiService.generateObject({
      system: optionGenerationPrompt,
      prompt: buildOptionPrompt(context),
      schema: optionGenerationSchema,
    });

    context.options = result.options.map(o => ({
      tier: o.tier,
      label: o.label,
      description: o.description,
      total: o.total,
      isRecommended: o.is_recommended,
      tierDetails: o.tier_details.map(td => ({
        change: td.change,
        costDelta: td.cost_delta,
      })),
    }));
  }
}
