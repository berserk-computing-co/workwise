import type { GenerationContext } from '../generation-context.js';

export const optionGenerationPrompt = `You are an expert construction cost estimator. You will be given a detailed scope breakdown with priced line items and you must generate exactly 3 pricing tiers: good, better, and best.

Guidelines for each tier:

**Good (budget)**: Use standard/basic materials, simplify where possible. Lower total than the base estimate. Set is_recommended to false. tier_details should list the changes made with NEGATIVE cost_delta values representing savings.

**Better (mid-range)**: The base estimate as-is. This is the recommended tier. Set is_recommended to true. tier_details should be an empty array since it is the baseline.

**Best (premium)**: Upgrade materials, add premium features or finishes. Higher total than the base estimate. Set is_recommended to false. tier_details should list the upgrades with POSITIVE cost_delta values.

Totals:
- Good total = base total + sum of all (negative) cost_delta values
- Best total = base total + sum of all (positive) cost_delta values
- Better total = base total exactly

Each tier must include:
- tier: one of "good", "better", "best"
- label: a short descriptive label (e.g., "Standard Repair", "Quality Build", "Premium Finish")
- description: 1-2 sentences describing what this tier includes
- total: the dollar total for this tier
- is_recommended: boolean
- tier_details: array of { change: string, cost_delta: number }

Return valid JSON matching the schema exactly. Output all 3 tiers in the order: good, better, best.`;

export function buildOptionPrompt(context: GenerationContext): string {
  const { projectDescription, projectType, sections, pricedItems, companyRates } = context;

  const materialSubtotal = pricedItems
    ? pricedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
    : 0;

  const totalLaborHours = sections
    ? sections.reduce((sum, section) => sum + section.laborHours, 0)
    : 0;

  const sectionLines: string[] = [];

  if (sections && pricedItems) {
    for (const section of sections) {
      const items = pricedItems.filter(item => item.sectionName === section.name);
      sectionLines.push(`Section: ${section.name}`);
      sectionLines.push(`  Labor Hours: ${section.laborHours}`);
      for (const item of items) {
        const lineTotal = item.quantity * item.unitCost;
        sectionLines.push(
          `  - ${item.description}: ${item.quantity} ${item.unit} @ $${item.unitCost.toFixed(2)} = $${lineTotal.toFixed(2)}`,
        );
      }
    }
  }

  return `Project Description: ${projectDescription}
Inferred Project Type: ${projectType ?? 'Unknown'}

Scope Breakdown:
${sectionLines.join('\n')}

Summary:
  Material Subtotal: $${materialSubtotal.toFixed(2)}
  Total Labor Hours: ${totalLaborHours}

Company Rates (for reference):
  Hourly Rate: $${companyRates.hourlyRate.toFixed(2)}/hr
  Overhead Multiplier: ${companyRates.overheadMultiplier}
  Profit Margin: ${companyRates.profitMargin}

Generate 3 pricing tiers (good, better, best) for this project.`;
}
