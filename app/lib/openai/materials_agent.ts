import { openai } from "./client";
import { fetchSourceItems } from "@/app/api/onebuild/one_build_client";
import { type EstimateItem } from "@/app/types/api/interfaces";
import type OpenAI from "openai";

const MAX_TOOL_CALLS = 15;

const searchMaterialsTool: OpenAI.Chat.ChatCompletionTool = {
  type: "function",
  function: {
    name: "search_materials",
    description:
      "Search 1Build for real material and labor pricing. Call this once per distinct line item needed for the project.",
    parameters: {
      type: "object",
      properties: {
        searchTerm: {
          type: "string",
          description: 'Specific product to search for, e.g. "pressure treated 2x6 lumber"',
        },
        quantity: {
          type: "number",
          description: "How many units are needed",
        },
        unit: {
          type: "string",
          description: 'Unit of measure abbreviation, e.g. "SF", "LF", "EA", "HR", "CY"',
        },
      },
      required: ["searchTerm", "quantity", "unit"],
    },
  },
};

interface SearchResult {
  found: boolean;
  name: string;
  price_per_unit_dollars: number;
  uom: string;
}

async function executSearchMaterials(
  args: { searchTerm: string; quantity: number; unit: string },
  location?: { state: string; zip: string }
): Promise<SearchResult> {
  const response = await fetchSourceItems({
    state: location?.state || "UT",
    zipcode: location?.zip || "84111",
    searchTerm: args.searchTerm,
  });

  const nodes = response?.data?.sources?.nodes ?? [];
  if (nodes.length === 0) {
    return { found: false, name: args.searchTerm, price_per_unit_dollars: 0, uom: args.unit };
  }

  const first = nodes[0];
  // Find the knownUom entry matching the requested unit, or fall back to first
  const uomEntry =
    first.knownUoms?.find((k) => k.uom === args.unit) ?? first.knownUoms?.[0];

  let priceCents = 0;
  if (uomEntry) {
    priceCents =
      uomEntry.calculatedUnitRateUsdCents > 0
        ? uomEntry.calculatedUnitRateUsdCents
        : uomEntry.materialRateUsdCents + uomEntry.laborRateUsdCents;
  }

  return {
    found: true,
    name: first.name,
    price_per_unit_dollars: priceCents / 100,
    uom: uomEntry?.uom ?? args.unit,
  };
}

export async function runMaterialsAgent(
  description: string,
  location?: { state: string; zip: string },
  imageBase64?: string,
  mimeType?: string
): Promise<EstimateItem[]> {
  const locationNote = location
    ? `Prices should reflect the project location: ${location.state}${location.zip ? ` ${location.zip}` : ""}.`
    : "";

  const systemMessage: OpenAI.Chat.ChatCompletionSystemMessageParam = {
    role: "system",
    content: `You are an expert construction estimator. Given a project description (and optionally a photo),
produce a detailed line-item estimate by calling search_materials for EVERY distinct material and labor item needed.
Be thorough — include materials, labor hours, equipment rental, and any other line items a professional estimator would include.${locationNote ? `\n${locationNote}` : ""}
After you have searched for all items, respond with a JSON array of estimate line items in this exact format (no markdown):
[
  {
    "name": "string",
    "description": "string",
    "quantity": number,
    "price_per_unit": number,
    "total_cost": number,
    "uom": "string"
  }
]
Do not include any other text outside the JSON array.`,
  };

  // Build user content — support vision when image is provided
  const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: "text", text: `Project description: ${description}` },
  ];

  if (imageBase64 && mimeType) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${imageBase64}`,
        detail: "high",
      },
    });
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    systemMessage,
    { role: "user", content: userContent },
  ];

  let toolCallCount = 0;

  // Agentic loop
  while (true) {
    const isAtLimit = toolCallCount >= MAX_TOOL_CALLS;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: isAtLimit ? undefined : [searchMaterialsTool],
      tool_choice: isAtLimit ? undefined : "auto",
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    // If the model wants to call tools, execute them
    if (choice.finish_reason === "tool_calls" && assistantMessage.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        toolCallCount++;
        let resultContent: string;

        try {
          // Narrow to standard function tool call (has .function property)
          if (!("function" in toolCall)) {
            resultContent = JSON.stringify({ found: false, error: "Unsupported tool call type" });
          } else {
            const args = JSON.parse(toolCall.function.arguments) as {
              searchTerm: string;
              quantity: number;
              unit: string;
            };
            const result = await executSearchMaterials(args, location);
            resultContent = JSON.stringify(result);
          }
        } catch (err) {
          resultContent = JSON.stringify({ found: false, error: String(err) });
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultContent,
        });
      }

      // Continue the loop to let the model process tool results
      continue;
    }

    // Model finished — parse the JSON array from the response
    const content = assistantMessage.content ?? "[]";
    const cleaned = content.replace(/```json|```/g, "").trim();

    try {
      const raw = JSON.parse(cleaned) as Array<{
        name: string;
        description: string;
        quantity: number;
        price_per_unit: number;
        total_cost: number;
        uom: string;
      }>;

      return raw.map((item) => ({
        name: item.name,
        description: item.description ?? "",
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        total_cost: item.total_cost ?? item.quantity * item.price_per_unit,
        estimatableType: "Material" as const,
        estimatableId: 0,
      }));
    } catch {
      return [];
    }
  }
}
