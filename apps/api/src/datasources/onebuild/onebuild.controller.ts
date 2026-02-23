import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OneBuildService } from './onebuild.service.js';
import type { SourceItem } from './onebuild.service.js';

function formatMatch(item: SourceItem, unit?: string) {
  return {
    id: item.id,
    name: item.name,
    uom: item.uom,
    knownUoms: item.knownUoms,
    imagesUrls: item.imagesUrls,
  };
}

@Controller('pricing')
export class OneBuildController {
  constructor(private readonly oneBuildService: OneBuildService) {}

  @Get('lookup')
  async lookup(
    @Query('description') description: string,
    @Query('zip') zip: string,
    @Query('unit') unit?: string,
  ) {
    const items = await this.oneBuildService.fetchSourceItems(description, zip, unit);
    const match = items[0] ?? null;
    return { match: match ? formatMatch(match, unit) : null };
  }

  @Post('batch-lookup')
  async batchLookup(
    @Body() body: { zip_code: string; items: { description: string; unit: string; quantity: number }[] },
  ) {
    const results = await this.oneBuildService.batchLookup(body.items, body.zip_code);
    return {
      results,
      matched_count: results.filter(r => r.matched).length,
      total_count: results.length,
    };
  }
}
