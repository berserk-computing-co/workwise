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
        multiplier: z.number(),
        is_recommended: z.boolean(),
        overrides: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .min(1),
});

const optionOutputFormat = zodOutputFormat(optionGenerationSchema);

const DEFAULT_OPTIONS: Record<OptionTier, Omit<OptionData, "tier">> = {
  [OptionTier.Good]: {
    multiplier: 0.8,
    label: "Budget",
    description: "Standard materials, simplified scope.",
    isRecommended: false,
    overrides: {},
  },
  [OptionTier.Better]: {
    multiplier: 1.0,
    label: "Standard",
    description: "Base estimate as specified.",
    isRecommended: true,
    overrides: {},
  },
  [OptionTier.Best]: {
    multiplier: 1.3,
    label: "Premium",
    description: "Upgraded materials and finishes.",
    isRecommended: false,
    overrides: {},
  },
};

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

    // Build a map of AI-returned options by tier
    const byTier = new Map<OptionTier, OptionData>();
    for (const o of deduped) {
      byTier.set(o.tier, {
        tier: o.tier,
        label: o.label,
        description: o.description,
        multiplier: o.multiplier,
        isRecommended: o.is_recommended,
        overrides: o.overrides as Record<string, unknown>,
      });
    }

    // Guarantee all 3 tiers exist — fill missing with defaults
    const tiers = [OptionTier.Good, OptionTier.Better, OptionTier.Best];
    context.options = tiers.map((tier) => {
      if (byTier.has(tier)) return byTier.get(tier)!;
      return { tier, ...DEFAULT_OPTIONS[tier] };
    });
  }
}
