import type {
  ServerToolDeclaration,
  UserLocation,
} from '../../../ai/interfaces/provider.interface.js';

/** Anthropic server-side web search tool for the scope decomposition agent. */
export const webSearchServerTool: ServerToolDeclaration = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 25,
};

/** Anthropic server-side web fetch tool for retrieving page content from search results. */
export const webFetchServerTool: ServerToolDeclaration = {
  type: 'web_fetch_20250910',
  name: 'web_fetch',
  max_uses: 10,
};

/**
 * Build a web_search tool with optional user_location for geographic context.
 * Falls back to the base tool when city/state are unavailable.
 */
export function buildWebSearchTool(
  city: string | null,
  state: string | null,
): ServerToolDeclaration {
  if (!city && !state) return webSearchServerTool;

  const userLocation: UserLocation = {
    type: 'approximate',
    ...(city && { city }),
    ...(state && { region: state }),
    country: 'US',
  };

  return {
    ...webSearchServerTool,
    user_location: userLocation,
  };
}
