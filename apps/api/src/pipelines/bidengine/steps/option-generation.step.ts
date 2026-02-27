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
    .min(1),
});

const optionOutputFormat = zodOutputFormat(optionGenerationSchema);

@Injectable()
export class OptionGenerationStep implements PipelineStep<BidEngineContext> {
  readonly name = "option_generation";

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async execute(context: BidEngineContext, signal: AbortSignal): Promise<void> {
    const response = await this.provider.chat({
      // TODO: Using Haiku to reduce token costs while iterating on pipeline.
      // Revisit upgrading to Sonnet once item count is optimized and prompt tokens are lower.
      model: "claude-haiku-4-5-20251001",
      system: optionGenerationPrompt,
      messages: [{ role: "user", content: buildOptionPrompt(context) }],
      maxTokens: 4096,
      outputFormat: optionOutputFormat,
    }, signal);

    if (response.stopReason !== "end_turn") {
      throw new Error(
        `OptionGenerationStep: unexpected stop_reason "${response.stopReason}"`,
      );
    }

    const result = optionOutputFormat.parse(response.text);

    // Deduplicate by tier — keep the first entry for each of good/better/best
    const seen = new Set<string>();
    const deduped = result.options.filter((o) => {
      if (seen.has(o.tier)) return false;
      seen.add(o.tier);
      return true;
    });

    context.options = deduped.map((o) => ({
      tier: o.tier,
      label: o.label,
      description: o.description,
      total: o.total,
      isRecommended: o.is_recommended,
      overrides: o.overrides as Record<string, unknown>,
    }));
  }
}
