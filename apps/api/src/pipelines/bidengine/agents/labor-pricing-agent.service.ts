import { Injectable, Logger } from '@nestjs/common';
import { AgentRunner } from '../../../ai/agent-runner.service.js';
import type { AgentConfig } from '../../../ai/interfaces/agent.interfaces.js';
import { repairTruncatedResultsJson } from '../../../ai/utils/json-repair.util.js';
import {
  webSearchServerTool,
  webFetchServerTool,
} from './scope-agent.tool.js';
import {
  pricingOutputFormat,
  type PricingResult,
} from './web-pricing-agent.service.js';
import { getLaborPricingPrompt } from '../prompts/labor-pricing.prompt.js';

@Injectable()
export class LaborPricingAgentService {
  private readonly logger = new Logger(LaborPricingAgentService.name);

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
      `Starting labor pricing: ${items.length} items, section="${sectionName}", ZIP=${zipCode}`,
    );

    // TODO: Build user_location from city/state/zipCode and add to webSearchServerTool spread
    const config: AgentConfig = {
      name: 'labor_pricing',
      model: 'claude-haiku-4-5-20251001',
      systemPrompt: getLaborPricingPrompt(sectionName),
      tools: [],
      serverTools: [webSearchServerTool, webFetchServerTool],
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
    const initialPrompt = `Price the following ${items.length} labor/permit/equipment items for the "${sectionName}" section near ${location} (ZIP ${zipCode}):\n\n${itemList}`;

    this.logger.debug(
      `Labor pricing prompt length: ${initialPrompt.length} chars`,
    );

    const result = await this.agentRunner.run(config, initialPrompt, signal);

    this.logger.log(
      `Labor pricing agent completed: ${result.iterations} iterations, ${result.toolCallCount} tool calls, output=${result.text.length} chars`,
    );

    if (result.toolCallCount === 0) {
      this.logger.warn(
        `Labor pricing agent returned results with 0 tool calls — prices are hallucinated, marking all unmatched`,
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
        `Labor pricing output was truncated (${text.length} chars), attempting JSON repair`,
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
        `Labor pricing parsed ${parsed.results.length} results (${parsed.results.filter((r) => r.matched).length} matched)${result.truncated ? ' (repaired from truncated output)' : ''}`,
      );
      return parsed.results;
    } catch (parseErr) {
      this.logger.error(
        `Labor pricing output parse failed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
      this.logger.error(
        `Raw agent output (first 500 chars): ${result.text.slice(0, 500)}`,
      );
      throw parseErr;
    }
  }
}
