import { Injectable, Logger } from "@nestjs/common";
import { PipelineStep } from "../../../pipeline/pipeline-step.interface.js";
import type { BidEngineContext, PricedItem } from "../bidengine-context.js";
import { ItemSource } from "../bidengine.enums.js";

@Injectable()
export class PriceMergeStep implements PipelineStep<BidEngineContext> {
  readonly name = "price_merge";

  private readonly logger = new Logger(PriceMergeStep.name);

  async execute(context: BidEngineContext, _signal: AbortSignal): Promise<void> {
    const oneBuild = context.oneBuildResults;
    const web = context.webResults;

    this.logger.log(
      `Merge input — oneBuild: ${oneBuild === undefined ? "undefined" : `${oneBuild.length} items`}, web: ${web === undefined ? "undefined" : `${web.length} items`}`,
    );

    const oneBuildPresent = oneBuild && oneBuild.length > 0;
    const webPresent = web && web.length > 0;

    if (!oneBuildPresent && !webPresent) {
      this.logger.error(
        `Both pricing sources empty/failed — oneBuild=${oneBuild === undefined ? "undefined" : `[] (len=${oneBuild.length})`}, web=${web === undefined ? "undefined" : `[] (len=${web.length})`}`,
      );
      throw new Error("Both pricing sources failed — cannot continue pipeline");
    }

    if (!oneBuildPresent) {
      context.pricedItems = web!;
      return;
    }

    if (!webPresent) {
      context.pricedItems = oneBuild;
      return;
    }

    // Both present — merge/reconcile
    const webMap = new Map<string, PricedItem>();
    for (const item of web!) {
      const key = `${item.description}::${item.sectionName}`;
      webMap.set(key, item);
    }

    const mergedItems: PricedItem[] = [];
    let fromOneBuild = 0;
    let fromWeb = 0;
    let fromEstimate = 0;

    for (const obItem of oneBuild) {
      const key = `${obItem.description}::${obItem.sectionName}`;
      const webItem = webMap.get(key);

      const obMatched = obItem.source === ItemSource.AiPriced;
      const webMatched = webItem?.source === ItemSource.WebPriced;

      if (obMatched && webMatched) {
        const obConfidence = (obItem.sourceData?.confidence as number) ?? 0;
        const webConfidence = (webItem!.sourceData?.confidence as number) ?? 0;

        let winner: PricedItem;
        let loser: PricedItem;
        let loserConfidence: number;

        if (webConfidence > obConfidence) {
          winner = webItem!;
          loser = obItem;
          loserConfidence = obConfidence;
          fromWeb++;
        } else {
          // equal or oneBuild higher — prefer oneBuild
          winner = obItem;
          loser = webItem!;
          loserConfidence = webConfidence;
          fromOneBuild++;
        }

        mergedItems.push({
          ...winner,
          sourceData: {
            ...winner.sourceData,
            alternateSource: {
              source: loser.source,
              unitCost: loser.unitCost,
              confidence: loserConfidence,
            },
          },
        });
      } else if (obMatched) {
        mergedItems.push(obItem);
        fromOneBuild++;
      } else if (webMatched) {
        mergedItems.push(webItem!);
        fromWeb++;
      } else {
        // Neither matched — preserve AI estimate
        mergedItems.push(obItem);
        fromEstimate++;
      }
    }

    context.pricedItems = mergedItems;

    this.logger.log(
      `Merged ${mergedItems.length} items: ${fromOneBuild} from OneBuild, ${fromWeb} from web, ${fromEstimate} unmatched`,
    );
  }
}
