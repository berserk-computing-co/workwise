import type { BidEngineContext } from "../bidengine-context.js";

export const optionGenerationPrompt = `You are an expert construction cost estimator. You will be given a detailed scope breakdown with priced line items and you must generate exactly 3 pricing tiers: good, better, and best.

Guidelines for each tier:

**Good (budget)**: Use standard/basic materials, simplify where possible. Lower total than the base estimate. Set is_recommended to false. overrides should capture the key changes as a record of adjustments.

**Better (mid-range)**: The base estimate as-is. This is the recommended tier. Set is_recommended to true. overrides should be an empty object since it is the baseline.

**Best (premium)**: Upgrade materials, add premium features or finishes. Higher total than the base estimate. Set is_recommended to false. overrides should capture the key upgrades.

Totals:
- Good total = base total reduced by simplified scope
- Best total = base total increased by premium upgrades
- Better total = base total exactly

Each tier must include:
- tier: one of "good", "better", "best"
- label: a short descriptive label (e.g., "Standard Repair", "Quality Build", "Premium Finish")
- description: 1-2 sentences describing what this tier includes
- total: the dollar total for this tier
- is_recommended: boolean
- overrides: object with any tier-specific adjustments

Return valid JSON matching the schema exactly. Output all 3 tiers in the order: good, better, best.
Output must be valid JSON matching the provided schema exactly. Do not wrap in markdown code fences.`;

export function buildOptionPrompt(context: BidEngineContext): string {
  const { description, sections, pricedItems } = context;

  const materialSubtotal = pricedItems
    ? pricedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
    : 0;

  const sectionLines: string[] = [];

  if (sections && pricedItems) {
    for (const section of sections) {
      const items = pricedItems.filter(
        (item) => item.sectionName === section.name,
      );
      sectionLines.push(`Section: ${section.name}`);
      for (const item of items) {
        const lineTotal = item.quantity * item.unitCost;
        sectionLines.push(
          `  - ${item.description}: ${item.quantity} ${item.unit} @ $${item.unitCost.toFixed(2)} = $${lineTotal.toFixed(2)} [${item.source}]`,
        );
      }
    }
  }

  return `Project Description: ${description}

Scope Breakdown:
${sectionLines.join("\n")}

Summary:
  Material Subtotal: $${materialSubtotal.toFixed(2)}

Generate 3 pricing tiers (good, better, best) for this project.`;
}
