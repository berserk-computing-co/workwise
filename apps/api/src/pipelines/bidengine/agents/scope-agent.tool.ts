import type { ServerToolDeclaration } from '../../../ai/interfaces/provider.interface.js';

/** Anthropic server-side web search tool for the scope decomposition agent. */
export const webSearchServerTool: ServerToolDeclaration = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 10,
};

/** Anthropic server-side web fetch tool for retrieving page content from search results. */
export const webFetchServerTool: ServerToolDeclaration = {
  type: 'web_fetch_20250910',
  name: 'web_fetch',
  max_uses: 5,
};
