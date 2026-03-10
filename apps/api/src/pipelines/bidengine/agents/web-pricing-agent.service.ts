import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { AgentRunner } from '../../../ai/agent-runner.service.js';
import type { AgentConfig } from '../../../ai/interfaces/agent.interfaces.js';
import { repairTruncatedResultsJson } from '../../../ai/utils/json-repair.util.js';
import {
  buildWebSearchTool,
  webFetchServerTool,
} from './scope-agent.tool.js';
import { getMaterialPricingPrompt } from '../prompts/web-pricing.prompt.js';

/** Shared schema — both MaterialPricingAgent and LaborPricingAgent output this shape. */
export const pricingResultSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      matched: z.boolean(),
      retailer: z.string().optional(),
      sourceUrl: z.string().optional(),
      unitCost: z.number(),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
      category: z.string(),
      skipReason: z.string().optional(),
    }),
  ),
});

export const pricingOutputFormat = zodOutputFormat(pricingResultSchema);

export type PricingResult = z.infer<
  typeof pricingResultSchema
>['results'][number];

@Injectable()
export class MaterialPricingAgentService {
  private readonly logger = new Logger(MaterialPricingAgentService.name);

  constructor(private readonly agentRunner: AgentRunner) {}

  async priceItems(
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      category: string;
    }>,
    zipCode: string,
    city: string | null,
    state: string | null,
    sectionName: string,
    signal: AbortSignal,
  ): Promise<PricingResult[]> {
    this.logger.log(
      `Starting material pricing: ${items.length} items, section="${sectionName}", ZIP=${zipCode}`,
    );

    const config: AgentConfig = {
      name: 'material_pricing',
      model: 'claude-haiku-4-5-20251001',
      systemPrompt: getMaterialPricingPrompt(sectionName),
      tools: [],
      serverTools: [buildWebSearchTool(city, state), webFetchServerTool],
      maxIterations: 40,
      maxTokens: 16384,
      outputFormat: pricingOutputFormat,
    };

    const itemList = items
      .map(
        (item, i) =>
          `${i}: ${JSON.stringify({ description: item.description, quantity: item.quantity, unit: item.unit, category: item.category })}`,
      )
      .join('\n');

    const location = [city, state].filter(Boolean).join(', ') || `ZIP ${zipCode}`;
    const initialPrompt = `Price the following ${items.length} material items for the "${sectionName}" section near ${location} (ZIP ${zipCode}):\n\n${itemList}`;

    this.logger.debug(
      `Material pricing prompt length: ${initialPrompt.length} chars`,
    );

    const result = await this.agentRunner.run(config, initialPrompt, signal);

    this.logger.log(
      `Material pricing agent completed: ${result.iterations} iterations, ${result.toolCallCount} tool calls, output=${result.text.length} chars`,
    );

    // Safety check: if the agent produced results without any tool calls,
    // it hallucinated prices instead of actually searching. Reject them.
    if (result.toolCallCount === 0) {
      this.logger.warn(
        `Material pricing agent returned results with 0 tool calls — prices are hallucinated, marking all unmatched`,
      );
      return items.map((_, i) => ({
        index: i,
        matched: false,
        unitCost: 0,
        confidence: 0,
        category: items[i].category,
        skipReason: 'agent_did_not_search',
      }));
    }

    let text = result.text;

    if (result.truncated) {
      this.logger.warn(
        `Material pricing output was truncated (${text.length} chars), attempting JSON repair`,
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
        `Material pricing parsed ${parsed.results.length} results (${parsed.results.filter((r) => r.matched).length} matched)${result.truncated ? ' (repaired from truncated output)' : ''}`,
      );
      return parsed.results;
    } catch (parseErr) {
      this.logger.error(
        `Material pricing output parse failed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
      this.logger.error(
        `Raw agent output (first 500 chars): ${result.text.slice(0, 500)}`,
      );
      throw parseErr;
    }
  }
}
