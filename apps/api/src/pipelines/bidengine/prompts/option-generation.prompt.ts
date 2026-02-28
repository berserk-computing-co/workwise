import type { BidEngineContext } from "../bidengine-context.js";

export const optionGenerationPrompt = `<role>
You are an expert construction cost estimator. You will be given a detailed scope breakdown with priced line items and you must generate exactly 3 pricing tiers: good, better, and best.
</role>

<instructions>
Guidelines for each tier:

**Good (budget)**: Use standard/basic materials, simplify where possible. Multiplier should be 0.75–0.85. Set is_recommended to false. overrides should capture the key changes as a record of adjustments.

**Better (mid-range)**: The base estimate as-is. This is the recommended tier. Multiplier must be exactly 1.0. Set is_recommended to true. overrides should be an empty object since it is the baseline.

**Best (premium)**: Upgrade materials, add premium features or finishes. Multiplier should be 1.2–1.4. Set is_recommended to false. overrides should capture the key upgrades.

Each tier must include:
- tier: one of "good", "better", "best"
- label: a short descriptive label (e.g., "Standard Repair", "Quality Build", "Premium Finish")
- description: 1-2 sentences describing what this tier includes
- multiplier: a number representing the cost multiplier relative to the base total
- is_recommended: boolean
- overrides: object with any tier-specific adjustments

Return valid JSON matching the schema exactly. Output all 3 tiers in the order: good, better, best.
</instructions>

<example>
Project: Replace toilet and vanity in small bathroom. Base total: $1,200.

{
  "options": [
    {
      "tier": "good",
      "label": "Basic Replacement",
      "description": "Standard builder-grade toilet and vanity with basic fixtures. Functional and code-compliant.",
      "multiplier": 0.8,
      "is_recommended": false,
      "overrides": {
        "toilet": "builder-grade elongated toilet ($180)",
        "vanity": "stock 24\\" vanity with cultured marble top ($220)"
      }
    },
    {
      "tier": "better",
      "label": "Quality Install",
      "description": "Mid-range toilet and vanity matching original spec. Recommended for balanced value and longevity.",
      "multiplier": 1.0,
      "is_recommended": true,
      "overrides": {}
    },
    {
      "tier": "best",
      "label": "Premium Upgrade",
      "description": "High-efficiency toilet with soft-close seat and custom vanity with quartz top. Upgraded fixtures throughout.",
      "multiplier": 1.35,
      "is_recommended": false,
      "overrides": {
        "toilet": "dual-flush high-efficiency toilet with soft-close seat ($420)",
        "vanity": "semi-custom 30\\" vanity with quartz top ($580)",
        "faucet": "brushed nickel single-hole faucet ($120)"
      }
    }
  ]
}
</example>

<output_format>
Output must be valid JSON matching the provided schema exactly. Do not wrap in markdown code fences.
</output_format>`;

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
