import { Injectable, Logger } from '@nestjs/common';
import { MaterialPricingAgentService } from './web-pricing-agent.service.js';
import { LaborPricingAgentService } from './labor-pricing-agent.service.js';
import type { PricingResult } from './web-pricing-agent.service.js';
import type { ScopeSection, PricedItem } from '../bidengine-context.js';
import { ItemCategory, ItemSource } from '../bidengine.enums.js';

/** Maximum material items per agent call. Larger sections get chunked. */
const MATERIAL_BATCH_SIZE = 12;

interface Batch {
  sectionName: string;
  type: 'material' | 'labor';
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
  originalIndices: number[];
}

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
   * Builds material and labor batches per section (chunking materials at
   * MATERIAL_BATCH_SIZE), runs all batches in parallel via Promise.allSettled,
   * then reconciles results back into a flat PricedItem[] in original order.
   * Failed batches produce AiUnmatched items with unitCost 0.
   */
  async priceAll(
    sections: ScopeSection[],
    zipCode: string,
    city: string | null,
    state: string | null,
    signal: AbortSignal,
    onBatchProgress?: (completed: number, total: number) => void,
  ): Promise<PricedItem[]> {
    const startMs = Date.now();

    // Build a flat array pre-allocated to hold the final results, sized by
    // total item count across all sections.
    const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
    const output: PricedItem[] = new Array(totalItems);

    // Also keep a reference to each item's section name and raw data so we can
    // fill output slots correctly during reconciliation.
    const flatItems: Array<{
      sectionName: string;
      item: ScopeSection['items'][number];
    }> = [];
    for (const section of sections) {
      for (const item of section.items) {
        flatItems.push({ sectionName: section.name, item });
      }
    }

    // 1. Build batches by walking sections.
    const batches: Batch[] = [];
    let flatIndex = 0;

    for (const section of sections) {
      const materialItems: Array<{
        description: string;
        quantity: number;
        unit: string;
        category: string;
      }> = [];
      const materialIndices: number[] = [];
      const laborItems: Array<{
        description: string;
        quantity: number;
        unit: string;
        category: string;
      }> = [];
      const laborIndices: number[] = [];

      for (const item of section.items) {
        const stripped = {
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        };
        if (item.category === ItemCategory.Material) {
          materialItems.push(stripped);
          materialIndices.push(flatIndex);
        } else {
          laborItems.push(stripped);
          laborIndices.push(flatIndex);
        }
        flatIndex++;
      }

      // Chunk materials into groups of MATERIAL_BATCH_SIZE.
      for (let i = 0; i < materialItems.length; i += MATERIAL_BATCH_SIZE) {
        batches.push({
          sectionName: section.name,
          type: 'material',
          items: materialItems.slice(i, i + MATERIAL_BATCH_SIZE),
          originalIndices: materialIndices.slice(i, i + MATERIAL_BATCH_SIZE),
        });
      }

      // Labor/equipment/permit/other go as one batch per section (no chunking).
      if (laborItems.length > 0) {
        batches.push({
          sectionName: section.name,
          type: 'labor',
          items: laborItems,
          originalIndices: laborIndices,
        });
      }
    }

    const materialBatchCount = batches.filter(
      (b) => b.type === 'material',
    ).length;
    const laborBatchCount = batches.filter((b) => b.type === 'labor').length;
    this.logger.log(
      `PricingFanOut: ${batches.length} total batches (${materialBatchCount} material, ${laborBatchCount} labor) for ${totalItems} items across ${sections.length} sections`,
    );

    // 2. Execute all batches in parallel.
    const settled = await Promise.allSettled(
      batches.map((batch) => {
        const agent =
          batch.type === 'material' ? this.materialAgent : this.laborAgent;
        return agent.priceItems(
          batch.items,
          zipCode,
          city,
          state,
          batch.sectionName,
          signal,
        );
      }),
    );

    // 3. Reconcile results into the flat output array.
    let fulfilledCount = 0;
    let rejectedCount = 0;
    const totalBatches = batches.length;
    let completedBatches = 0;

    for (let batchIdx = 0; batchIdx < settled.length; batchIdx++) {
      const result = settled[batchIdx];
      const batch = batches[batchIdx];

      if (result.status === 'fulfilled') {
        fulfilledCount++;
        const pricingResults: PricingResult[] = result.value;

        for (const pr of pricingResults) {
          const outIdx = batch.originalIndices[pr.index];
          if (outIdx === undefined) {
            this.logger.warn(
              `Batch ${batchIdx} (${batch.sectionName}/${batch.type}) returned result.index=${pr.index} which has no originalIndices entry — skipping`,
            );
            continue;
          }
          const flat = flatItems[outIdx];
          if (pr.matched) {
            output[outIdx] = {
              description: flat.item.description,
              quantity: flat.item.quantity,
              unit: flat.item.unit,
              unitCost: pr.unitCost,
              source: ItemSource.WebPriced,
              sourceUrl: pr.sourceUrl,
              sourceData: {
                retailer: pr.retailer,
                confidence: pr.confidence,
                notes: pr.notes,
              },
              sectionName: batch.sectionName,
            };
          } else {
            output[outIdx] = {
              description: flat.item.description,
              quantity: flat.item.quantity,
              unit: flat.item.unit,
              unitCost: pr.unitCost,
              source: ItemSource.AiUnmatched,
              sectionName: batch.sectionName,
            };
          }
        }

        // Fill any indices not covered by results (agent may return fewer entries).
        for (let i = 0; i < batch.originalIndices.length; i++) {
          const outIdx = batch.originalIndices[i];
          if (output[outIdx] === undefined) {
            const flat = flatItems[outIdx];
            output[outIdx] = {
              description: flat.item.description,
              quantity: flat.item.quantity,
              unit: flat.item.unit,
              unitCost: 0,
              source: ItemSource.AiUnmatched,
              sectionName: batch.sectionName,
            };
          }
        }
      } else {
        rejectedCount++;
        this.logger.error(
          `Batch ${batchIdx} (${batch.sectionName}/${batch.type}) rejected: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
        );

        // Fill all items in the failed batch with AiUnmatched.
        for (const outIdx of batch.originalIndices) {
          const flat = flatItems[outIdx];
          output[outIdx] = {
            description: flat.item.description,
            quantity: flat.item.quantity,
            unit: flat.item.unit,
            unitCost: 0,
            source: ItemSource.AiUnmatched,
            sectionName: batch.sectionName,
          };
        }
      }

      completedBatches++;
      onBatchProgress?.(completedBatches, totalBatches);
    }

    const elapsedMs = Date.now() - startMs;
    this.logger.log(
      `PricingFanOut complete: ${fulfilledCount} fulfilled, ${rejectedCount} rejected in ${elapsedMs}ms`,
    );

    return output;
  }
}
