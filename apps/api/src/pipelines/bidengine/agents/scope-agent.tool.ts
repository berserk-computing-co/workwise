import type { AgentTool } from "../../../ai/interfaces/agent.interfaces.js";

export function createWebSearchTool(): AgentTool {
  return {
    definition: {
      name: "web_search",
      description:
        "Search the web for construction pricing, material specifications, and building code requirements.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
    execute: async (_input) => {
      return {
        results: [],
        message: "web_search is not yet implemented — returning empty results",
      };
    },
  };
}
