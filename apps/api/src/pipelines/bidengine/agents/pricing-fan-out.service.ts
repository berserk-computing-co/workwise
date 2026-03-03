import { Injectable, Logger } from '@nestjs/common';
import { MaterialPricingAgentService } from './web-pricing-agent.service.js';
import { LaborPricingAgentService } from './labor-pricing-agent.service.js';
import type { PricingResult } from './web-pricing-agent.service.js';
import type { ScopeSection, PricedItem } from '../bidengine-context.js';
import { ItemSource } from '../bidengine.enums.js';

/** Maximum material items per agent call. Larger sections get chunked. */
const MATERIAL_BATCH_SIZE = 12;

@Injectable()
export class PricingFanOutService {
  private readonly logger = new Logger(PricingFanOutService.name);

  constructor(
    private readonly materialAgent: MaterialPricingAgentService,
    private readonly laborAgent: LaborPricingAgentService,
  ) {}

  /**
   * Price all items across all sections using section-aware fan-out.
   *
   * Algorithm:
   * 1. For each section, split items by category (material vs labor/permit/equipment)
   * 2. Chunk material batches at MATERIAL_BATCH_SIZE items max
   * 3. Run ALL batches in parallel via Promise.allSettled
   * 4. Reconcile results back into PricedItem[] in original section/item order
   * 5. Failed batches → items get AiUnmatched with unitCost: 0
   */
  async priceAll(
    sections: ScopeSection[],
    zipCode: string,
    city: string | null,
    state: string | null,
    signal: AbortSignal,
  ): Promise<PricedItem[]> {
    // TODO: Implement section-aware fan-out
    //
    // Suggested approach:
    //
    // interface Batch {
    //   sectionName: string;
    //   type: 'material' | 'labor';
    //   items: Array<{ description: string; quantity: number; unit: string; category: string }>;
    //   originalIndices: number[]; // position in the flat output array
    // }
    //
    // 1. Build batches:
    //    - Walk sections, split items by category
    //    - Chunk materials into groups of MATERIAL_BATCH_SIZE
    //    - Track each item's position in the flat output
    //
    // 2. Execute:
    //    const settled = await Promise.allSettled(
    //      batches.map(batch => {
    //        const agent = batch.type === 'material' ? this.materialAgent : this.laborAgent;
    //        return agent.priceItems(batch.items, zipCode, city, state, batch.sectionName, signal);
    //      })
    //    );
    //
    // 3. Reconcile:
    //    - For fulfilled: map PricingResult[] back to PricedItem[] using originalIndices
    //    - For rejected: fill with AiUnmatched items
    //    - Return flat PricedItem[] in original order

    void [sections, zipCode, city, state, signal]; // suppress unused warnings
    void [this.materialAgent, this.laborAgent]; // suppress unused warnings
    void MATERIAL_BATCH_SIZE;
    throw new Error('PricingFanOutService.priceAll() not implemented');
  }
}
