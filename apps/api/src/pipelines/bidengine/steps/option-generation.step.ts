import { Inject, Injectable, Logger } from "@nestjs/common";
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
    .min(3)
    .max(3),
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
  private readonly logger = new Logger(OptionGenerationStep.name);

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

    let parsed: z.infer<typeof optionGenerationSchema> | null = null;
    try {
      parsed = optionOutputFormat.parse(response.text);
    } catch (err) {
      this.logger.warn(
        `Structured output parse failed, falling back to defaults: ${(err as Error).message}`,
      );
    }

    // Build a map of AI-returned options by tier (skip invalid entries)
    const byTier = new Map<OptionTier, OptionData>();
    if (parsed) {
      const seen = new Set<string>();
      for (const o of parsed.options) {
        if (seen.has(o.tier)) continue;
        seen.add(o.tier);
        byTier.set(o.tier, {
          tier: o.tier,
          label: o.label,
          description: o.description,
          multiplier: o.multiplier,
          isRecommended: o.is_recommended,
          overrides: o.overrides as Record<string, unknown>,
        });
      }
    }

    // Guarantee all 3 tiers exist — fill missing with defaults
    const tiers = [OptionTier.Good, OptionTier.Better, OptionTier.Best];
    context.options = tiers.map((tier) => {
      if (byTier.has(tier)) return byTier.get(tier)!;
      return { tier, ...DEFAULT_OPTIONS[tier] };
    });
  }
}
