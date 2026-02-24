import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import type { AiProvider } from "../../../ai/interfaces/provider.interface.js";
import { AI_PROVIDER } from "../../../ai/interfaces/provider.interface.js";
import type { BidEngineContext } from "../bidengine-context.js";
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
          unit_cost: z.number(),
          category: z.enum([
            "material",
            "labor",
            "equipment",
            "permit",
            "other",
          ]),
        }),
      ),
    }),
  ),
  confidence: z.number().min(0).max(1),
});

@Injectable()
export class ScopeDecompositionStep implements PipelineStep<BidEngineContext> {
  readonly name = "scope_decomposition";

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async execute(context: BidEngineContext): Promise<void> {
    const response = await this.provider.chat({
      model: "claude-sonnet-4-20250514",
      system: getScopePrompt(context.category),
      messages: [{ role: "user", content: buildUserPrompt(context) }],
      maxTokens: 4096,
    });

    const result = scopeDecompositionSchema.parse(JSON.parse(response.text));

    context.sections = result.sections.map((s) => ({
      name: s.name,
      items: s.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitCost: i.unit_cost,
        category: i.category,
      })),
    }));
  }
}
