import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import type { AiProvider } from "../../../ai/interfaces/provider.interface.js";
import { AI_PROVIDER } from "../../../ai/interfaces/provider.interface.js";
import type { BidEngineContext } from "../bidengine-context.js";
import { ItemCategory } from "../bidengine.enums.js";
import {
  getScopePrompt,
  buildUserPrompt,
} from "../prompts/scope-decomposition.prompt.js";

const scopeDecompositionSchema = z.object({
  sections: z.array(
    z.object({
      name: z.string(),
      labor_hours: z.number(),
      items: z.array(
        z.object({
          description: z.string(),
          quantity: z.number(),
          unit: z.string(),
          category: z.nativeEnum(ItemCategory),
          pricing_hint: z
            .enum(["material", "assembly", "labor_rate", "skip"])
            .optional(),
        }),
      ),
    }),
  ),
  confidence: z.number().min(0).max(1),
});

const scopeOutputFormat = zodOutputFormat(scopeDecompositionSchema);

@Injectable()
export class ScopeDecompositionStep implements PipelineStep<BidEngineContext> {
  readonly name = "scope_decomposition";

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async execute(context: BidEngineContext, signal: AbortSignal): Promise<void> {
    const response = await this.provider.chat({
      // TODO: Using Haiku to reduce token costs while iterating on pipeline.
      // Revisit upgrading to Sonnet once item count is optimized and prompt tokens are lower.
      model: "claude-haiku-4-5-20251001",
      system: getScopePrompt(context.category),
      messages: [{ role: "user", content: buildUserPrompt(context) }],
      maxTokens: 8192,
      outputFormat: scopeOutputFormat,
    }, signal);

    if (response.stopReason !== "end_turn") {
      throw new Error(
        `ScopeDecompositionStep: unexpected stop_reason "${response.stopReason}"`,
      );
    }

    const result = scopeOutputFormat.parse(response.text);

    context.sections = result.sections.map((s) => ({
      name: s.name,
      labor_hours: s.labor_hours,
      items: s.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        category: i.category,
        pricing_hint: i.pricing_hint,
      })),
    }));
  }
}
