import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import type { AiProvider } from "../../../ai/interfaces/provider.interface.js";
import { AI_PROVIDER } from "../../../ai/interfaces/provider.interface.js";
import type { BidEngineContext, OptionData } from "../bidengine-context.js";
import {
  optionGenerationPrompt,
  buildOptionPrompt,
} from "../prompts/option-generation.prompt.js";

const optionGenerationSchema = z.object({
  options: z
    .array(
      z.object({
        tier: z.enum(["good", "better", "best"]),
        label: z.string(),
        description: z.string(),
        total: z.number(),
        is_recommended: z.boolean(),
        overrides: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .min(3)
    .max(3),
});

@Injectable()
export class OptionGenerationStep implements PipelineStep<BidEngineContext> {
  readonly name = "option_generation";

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async execute(context: BidEngineContext): Promise<void> {
    const response = await this.provider.chat({
      model: "claude-sonnet-4-20250514",
      system: optionGenerationPrompt,
      messages: [{ role: "user", content: buildOptionPrompt(context) }],
      maxTokens: 4096,
    });

    const result = optionGenerationSchema.parse(JSON.parse(response.text));

    context.options = result.options.map((o) => ({
      tier: o.tier,
      label: o.label,
      description: o.description,
      total: o.total,
      isRecommended: o.is_recommended,
      overrides: o.overrides as Record<string, unknown>,
    }));
  }
}
