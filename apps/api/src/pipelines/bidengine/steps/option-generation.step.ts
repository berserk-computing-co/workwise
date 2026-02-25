import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import type { AiProvider } from "../../../ai/interfaces/provider.interface.js";
import { AI_PROVIDER } from "../../../ai/interfaces/provider.interface.js";
import type { BidEngineContext, OptionData } from "../bidengine-context.js";
import { OptionTier } from "../bidengine.enums.js";
import {
  optionGenerationPrompt,
  buildOptionPrompt,
} from "../prompts/option-generation.prompt.js";

const optionGenerationSchema = z.object({
  options: z
    .array(
      z.object({
        tier: z.nativeEnum(OptionTier),
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

const optionOutputFormat = zodOutputFormat(optionGenerationSchema);

@Injectable()
export class OptionGenerationStep implements PipelineStep<BidEngineContext> {
  readonly name = "option_generation";

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async execute(context: BidEngineContext): Promise<void> {
    const response = await this.provider.chat({
      model: "claude-sonnet-4-6",
      system: optionGenerationPrompt,
      messages: [{ role: "user", content: buildOptionPrompt(context) }],
      maxTokens: 4096,
      outputFormat: optionOutputFormat,
    });

    if (response.stopReason !== "end_turn") {
      throw new Error(
        `OptionGenerationStep: unexpected stop_reason "${response.stopReason}"`,
      );
    }

    const result = optionOutputFormat.parse(response.text);

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
