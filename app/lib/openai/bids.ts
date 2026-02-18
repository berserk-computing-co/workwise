import { openai } from "./client";
import { type Bid } from "@/app/types";
import { type Estimate, type EstimateItem } from "@/app/types/api/interfaces";

// --- Types ---

export interface AnomalyResult {
  estimateItemId: number;
  estimatedPrice: number;
  suggestedPrice: number;
  reason: string;
}

export interface BidDocumentSection {
  type: "heading" | "paragraph" | "table" | "totals";
  title?: string;
  content?: string;
  columns?: string[];
  rows?: string[][];
  items?: Array<{ label: string; value: string }>;
}

export interface BidDocumentSpec {
  title: string;
  sections: BidDocumentSection[];
}

// --- Helpers ---

function clientName(client: Bid["client"]): string {
  if (!client) return "N/A";
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || "N/A";
}

function formatAddress(address: Partial<Bid["address"]>): string {
  if (!address) return "N/A";
  const parts = [address.street, address.city, address.state, address.zip].filter(Boolean);
  return parts.join(", ") || "N/A";
}

function getLatestEstimate(bid: Partial<Bid>): Partial<Estimate> {
  return bid.estimates?.[0] ?? {};
}

function formatEstimateItems(items: EstimateItem[]): string {
  return items
    .map(
      (item) =>
        `- ${item.name}: ${item.quantity} unit(s) at $${item.price_per_unit} each, total: $${item.total_cost}, phase: ${item.phase?.name ?? "no phase assigned"}`
    )
    .join("\n");
}

// --- generateBidEmailMessage ---

export async function generateBidEmailMessage(bid: Partial<Bid>): Promise<string> {
  const estimate = getLatestEstimate(bid);
  const items: EstimateItem[] = estimate.estimateItems ?? estimate.estimate_items ?? [];
  const phases = Array.from(new Set(items.flatMap((i) => (i.phase ? [i.phase.name] : [])))).join(", ");

  const prompt = `
Draft a concise email to a client about their construction project bid.
Keep the details straightforward, focusing on the project's key aspects and do not
mentioning any specific materials and do not use technical jargon. Focus on cost, location and time frame and the description if applicable.
Mention the project phases if applicable, but only in general terms.
Request call to action for the client to review and respond to the bid
No buzz words or unnecessary adjectives, keep it simple and professional with minimal usage of large vocabulary.
I do not need a subject. No introduction needed. No fluff and buzz words around the services provided, keep it simple.
After crafting the message ensure it checks all of the requirements i just listed.

Client Name: ${clientName(bid.client)}
Project Phases: ${phases || "N/A"}

Project Description:
${bid.description ?? "N/A"}

Address: ${formatAddress(bid.address ?? {})}

Estimate Items:
${formatEstimateItems(items)}

Total Cost: $${bid.estimated_cost ?? 0}
Completion Date: ${estimate.completion_date ?? "N/A"}
Expiration Date: ${estimate.expiration_date ?? "N/A"}

Do not leave any blanks to fill in. Use the info i have provided to craft the message.
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "Generate a professional and concise email based on the following details. Avoid technical jargon and focus on simplicity and clarity. Ensure all provided details are included without adding any fluff or unnecessary descriptors.",
      },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0].message.content ?? "";
}

// --- analyzeBid ---

export async function analyzeBid(bid: Partial<Bid>): Promise<AnomalyResult[]> {
  const estimate = getLatestEstimate(bid);
  const items: EstimateItem[] = estimate.estimateItems ?? estimate.estimate_items ?? [];

  const bidData = JSON.stringify(
    {
      bid: {
        name: bid.name,
        description: bid.description,
        address: formatAddress(bid.address ?? {}),
      },
      latest_estimate: {
        estimated_cost: bid.estimated_cost,
        estimate_items: items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price_per_unit: i.price_per_unit,
          quantity: i.quantity,
          total_cost: i.total_cost,
        })),
      },
    },
    null,
    2
  );

  const prompt = `
Given the bid data below scan all line items and look for items that are easily validated and look
like anomalies due to being under or over priced and respond with the estimate item id and its
listed price vs actual price you find online. Use the sites like home depot, lowes and any other pricing data
be sure to use location based prices based on the bids address. Also take labor costs into account. Remember all
of these line items refer to expenses for a construction project

Dont analyze all the line items only those that stick out the most or are easily validated
If nothing looks incorrect respond with an empty array { "anomalies": []}
The suggested price should be price per unit so make sure you look at the price per unit on anomaly items
Be smart enough to infer what the unit of measurement may be even if one is not present

Respond in json format like below
{ "anomalies": [{"estimate_item_id": <id>, "estimated_price": <price>, "suggested_price": <price>, "reason": "<sentence>"}] }

${bidData}
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are an expert construction bid creator/estimator with access to the internet and up to date material prices. You analyze bids to find line items that seem like an anomaly due to being under or over priced.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message.content ?? "";
  const cleaned = content.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/"anomalies"\s*:\s*(\[[\s\S]*?\])/);
  if (!match) return [];

  try {
    const raw: Array<{
      estimate_item_id: number;
      estimated_price: number;
      suggested_price: number;
      reason: string;
    }> = JSON.parse(match[1]);
    return raw.map((item) => ({
      estimateItemId: item.estimate_item_id,
      estimatedPrice: item.estimated_price,
      suggestedPrice: item.suggested_price,
      reason: item.reason,
    }));
  } catch {
    return [];
  }
}

// --- generateBidDocumentSpec ---

export async function generateBidDocumentSpec(bid: Partial<Bid>): Promise<BidDocumentSpec> {
  const estimate = getLatestEstimate(bid);
  const items: EstimateItem[] = estimate.estimateItems ?? estimate.estimate_items ?? [];

  // Group items by phase
  const grouped = items.reduce<Record<string, EstimateItem[]>>((acc, item) => {
    const key = item.phase?.name ?? "General";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  const bidData = JSON.stringify(
    {
      name: bid.name,
      description: bid.description,
      address: formatAddress(bid.address ?? {}),
      client: clientName(bid.client),
      estimated_cost: bid.estimated_cost,
      completion_date: estimate.completion_date,
      expiration_date: estimate.expiration_date,
      phases: Object.keys(grouped),
      estimate_items: items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price_per_unit: i.price_per_unit,
        quantity: i.quantity,
        total_cost: i.total_cost,
        phase: i.phase?.name ?? null,
      })),
    },
    null,
    2
  );

  const prompt = `
You are generating a structured JSON document specification for a construction bid PDF.
Based on the bid data below, return a JSON object that describes the layout and content of the PDF.

The JSON must follow this TypeScript type exactly:
{
  "title": string,
  "sections": Array<
    | { "type": "heading", "title": string }
    | { "type": "paragraph", "content": string }
    | { "type": "table", "title": string, "columns": string[], "rows": string[][] }
    | { "type": "totals", "items": Array<{ "label": string, "value": string }> }
  >
}

Guidelines:
- Include a company/bid header section
- Include bid details (client, address, dates)
- Group estimate items by phase into separate tables
- Include a totals section at the end
- Be creative with section titles
- Fill all values from the bid data — no placeholders

Bid data:
${bidData}

Respond with ONLY valid JSON, no markdown, no explanation.
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an expert construction bid document designer. Respond only with valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const cleaned = content.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned) as BidDocumentSpec;
  } catch {
    // Fallback minimal spec
    return {
      title: bid.name ?? "Construction Bid",
      sections: [
        { type: "heading", title: bid.name ?? "Construction Bid" },
        { type: "paragraph", content: bid.description ?? "" },
      ],
    };
  }
}
