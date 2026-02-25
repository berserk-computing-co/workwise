import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AgentRunner } from "../../../ai/agent-runner.service.js";
import type { AgentResult } from "../../../ai/interfaces/agent.interfaces.js";
import { ItemCategory } from "../bidengine.enums.js";
import {
  getScopePrompt,
  buildUserPrompt,
} from "../prompts/scope-decomposition.prompt.js";
import { webSearchServerTool } from "./scope-agent.tool.js";

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
          category: z.nativeEnum(ItemCategory),
        }),
      ),
    }),
  ),
  confidence: z.number().min(0).max(1),
});

const scopeOutputFormat = zodOutputFormat(scopeDecompositionSchema);

export type ScopeDecompositionOutput = z.infer<typeof scopeDecompositionSchema>;

@Injectable()
export class ScopeAgentService {
  constructor(private readonly agentRunner: AgentRunner) {}

  async decompose(
    description: string,
    category: string,
    zipCode: string,
    address: string,
  ): Promise<AgentResult & { parsed: ScopeDecompositionOutput }> {
    const config = {
      name: "scope_decomposition",
      model: "claude-sonnet-4-6",
      systemPrompt: getScopePrompt(category),
      tools: [],
      serverTools: [webSearchServerTool],
      maxIterations: 10,
      maxTokens: 8192,
      outputFormat: scopeOutputFormat,
    };

    const initialPrompt = buildUserPrompt({
      description,
      zipCode,
      category,
      address,
    });

    const result = await this.agentRunner.run(config, initialPrompt);
    const parsed = scopeOutputFormat.parse(result.text);

    return { ...result, parsed };
  }
}
