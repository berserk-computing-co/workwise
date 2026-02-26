import { Injectable, Logger } from "@nestjs/common";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AgentRunner } from "../../ai/agent-runner.service.js";
import { OneBuildService } from "./onebuild.service.js";
import { getResolutionPrompt } from "./prompts/resolution.prompt.js";
import { createSearch1BuildTool } from "./onebuild.tool.js";
import type { AgentConfig } from "../../ai/interfaces/agent.interfaces.js";
import { repairTruncatedResultsJson } from "../../ai/utils/json-repair.util.js";

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
      category: z.string().default("uncategorized"),
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
      category: string;
      sectionName: string;
      pricingHint?: string;
    }>,
    zipCode: string,
  ): Promise<PricingResult[]> {
    this.logger.log(
      `Starting OneBuild pricing: ${items.length} items, ZIP=${zipCode}`,
    );

    const config: AgentConfig = {
      name: "onebuild_resolution",
      model: "claude-haiku-4-5-20251001",
      systemPrompt: getResolutionPrompt(),
      tools: [createSearch1BuildTool(this.oneBuildService)],
      maxIterations: 30,
      maxTokens: 8192,
      outputFormat: pricingOutputFormat,
    };

    const itemList = items
      .map((item, i) => {
        const entry: Record<string, unknown> = {
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        };
        if (item.pricingHint) {
          entry.pricing_hint = item.pricingHint;
        }
        return `${i}: ${JSON.stringify(entry)}`;
      })
      .join("\n");

    const initialPrompt = `Price the following ${items.length} items for ZIP code ${zipCode}:\n\n${itemList}`;

    this.logger.debug(
      `OneBuild prompt length: ${initialPrompt.length} chars`,
    );

    const result = await this.agentRunner.run(config, initialPrompt);

    this.logger.log(
      `OneBuild agent completed: ${result.iterations} iterations, ${result.toolCallCount} tool calls, output=${result.text.length} chars`,
    );

    let text = result.text;

    if (result.truncated) {
      this.logger.warn(
        `OneBuild output was truncated (${text.length} chars), attempting JSON repair`,
      );
      const { repaired, success } = repairTruncatedResultsJson(text);
      if (success) {
        this.logger.log(
          `JSON repair succeeded: salvaged ${repaired.length} of ${text.length} chars`,
        );
        text = repaired;
      } else {
        this.logger.warn(`JSON repair failed — parse will likely throw`);
      }
    }

    try {
      const parsed = pricingOutputFormat.parse(text);
      this.logger.log(
        `OneBuild parsed ${parsed.results.length} results (${parsed.results.filter((r) => r.matched).length} matched)${result.truncated ? " (repaired from truncated output)" : ""}`,
      );
      return parsed.results;
    } catch (parseErr) {
      this.logger.error(
        `OneBuild output parse failed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
      this.logger.error(
        `Raw agent output (first 500 chars): ${result.text.slice(0, 500)}`,
      );
      throw parseErr;
    }
  }
}
