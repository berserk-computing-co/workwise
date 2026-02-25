import type { ServerToolDeclaration } from "../../../ai/interfaces/provider.interface.js";

/** Anthropic server-side web search tool for the scope decomposition agent. */
export const webSearchServerTool: ServerToolDeclaration = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 10,
};
