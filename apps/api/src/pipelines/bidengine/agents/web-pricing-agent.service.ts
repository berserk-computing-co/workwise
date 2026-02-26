import { Injectable, Logger } from "@nestjs/common";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AgentRunner } from "../../../ai/agent-runner.service.js";
import type { AgentConfig } from "../../../ai/interfaces/agent.interfaces.js";
import { webSearchServerTool } from "./scope-agent.tool.js";
import { getWebPricingPrompt } from "../prompts/web-pricing.prompt.js";

const webPricingResultSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      matched: z.boolean(),
      retailer: z.string().optional(),
      productUrl: z.string().optional(),
      unitCost: z.number(),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
      category: z.string(),
      skipReason: z.string().optional(),
    }),
  ),
});

const webPricingOutputFormat = zodOutputFormat(webPricingResultSchema);

export type WebPricingResult = z.infer<
  typeof webPricingResultSchema
>["results"][number];

@Injectable()
export class WebPricingAgentService {
  private readonly logger = new Logger(WebPricingAgentService.name);

  constructor(private readonly agentRunner: AgentRunner) {}

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
  ): Promise<WebPricingResult[]> {
    const config: AgentConfig = {
      name: "web_pricing",
      model: "claude-sonnet-4-6",
      systemPrompt: getWebPricingPrompt(),
      tools: [],
      serverTools: [{ ...webSearchServerTool, max_uses: 15 }],
      maxIterations: 15,
      maxTokens: 8192,
      outputFormat: webPricingOutputFormat,
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
      `Web pricing agent completed: ${result.iterations} iterations, ${result.toolCallCount} tool calls`,
    );

    const parsed = webPricingOutputFormat.parse(result.text);
    return parsed.results;
  }
}
