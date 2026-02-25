import { Injectable, Logger } from "@nestjs/common";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AgentRunner } from "../../ai/agent-runner.service.js";
import { OneBuildService } from "./onebuild.service.js";
import { getResolutionPrompt } from "./prompts/resolution.prompt.js";
import { createSearch1BuildTool } from "./onebuild.tool.js";
import type { AgentConfig } from "../../ai/interfaces/agent.interfaces.js";

const pricingResultSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      matched: z.boolean(),
      onebuildId: z.string().optional(),
      onebuildName: z.string().optional(),
      materialUnitCost: z.number(),
      laborUnitCost: z.number(),
      unitCost: z.number(),
      laborSource: z.string(),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
      category: z.string(),
      skipReason: z.string().optional(),
    }),
  ),
});

const pricingOutputFormat = zodOutputFormat(pricingResultSchema);

export type PricingResult = z.infer<
  typeof pricingResultSchema
>["results"][number];

@Injectable()
export class OneBuildAgentService {
  private readonly logger = new Logger(OneBuildAgentService.name);

  constructor(
    private readonly agentRunner: AgentRunner,
    private readonly oneBuildService: OneBuildService,
  ) {}

  async priceItems(
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      unitCost: number;
      category: string;
      sectionName: string;
    }>,
    zipCode: string,
  ): Promise<PricingResult[]> {
    const config: AgentConfig = {
      name: "onebuild_resolution",
      model: "claude-sonnet-4-6",
      systemPrompt: getResolutionPrompt(),
      tools: [createSearch1BuildTool(this.oneBuildService)],
      maxIterations: 30,
      maxTokens: 8192,
      outputFormat: pricingOutputFormat,
    };

    const itemList = items
      .map(
        (item, i) =>
          `${i}: ${JSON.stringify({ description: item.description, quantity: item.quantity, unit: item.unit, unitCost: item.unitCost, category: item.category })}`,
      )
      .join("\n");

    const initialPrompt = `Price the following ${items.length} items for ZIP code ${zipCode}:\n\n${itemList}`;

    const result = await this.agentRunner.run(config, initialPrompt);

    this.logger.log(
      `Pricing agent completed: ${result.iterations} iterations, ${result.toolCallCount} tool calls`,
    );

    const parsed = pricingOutputFormat.parse(result.text);
    return parsed.results;
  }
}
