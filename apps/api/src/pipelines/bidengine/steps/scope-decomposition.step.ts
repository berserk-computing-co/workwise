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

const scopeDecompositionJsonSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["sections", "confidence"],
  properties: {
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "labor_hours", "items"],
        properties: {
          name: { type: "string" },
          labor_hours: { type: "number" },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "description",
                "quantity",
                "unit",
                "unit_cost",
                "category",
              ],
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                unit_cost: { type: "number" },
                category: {
                  type: "string",
                  enum: ["material", "labor", "equipment", "permit", "other"],
                },
              },
            },
          },
        },
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
};

@Injectable()
export class ScopeDecompositionStep implements PipelineStep<BidEngineContext> {
  readonly name = "scope_decomposition";

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async execute(context: BidEngineContext): Promise<void> {
    const response = await this.provider.chat({
      model: "claude-sonnet-4-6",
      system: getScopePrompt(context.category),
      messages: [{ role: "user", content: buildUserPrompt(context) }],
      maxTokens: 4096,
      outputSchema: scopeDecompositionJsonSchema,
    });

    if (response.stopReason !== "end_turn") {
      throw new Error(
        `ScopeDecompositionStep: unexpected stop_reason "${response.stopReason}"`,
      );
    }

    const result = scopeDecompositionSchema.parse(JSON.parse(response.text));

    context.sections = result.sections.map((s) => ({
      name: s.name,
      labor_hours: s.labor_hours,
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
