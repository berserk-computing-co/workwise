/**
 * Vite-aliased replacement for @googlemaps/js-api-loader.
 * Storybook's viteFinal replaces the real package with this file so stories
 * never hit the network. Stories that need suggestions set
 * window.__mockGoogleMapsLib in beforeEach; otherwise the mock returns an
 * empty lib (no suggestions — safe for Idle / Disabled stories).
 */

type MockPlacesLib = {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (
      params: unknown,
    ) => Promise<{ suggestions: unknown[] }>;
  };
};

declare global {
  interface Window {
    __mockGoogleMapsLib?: MockPlacesLib;
  }
}

export const LoaderStatus = {
  INITIALIZED: 0 as const,
  LOADING: 1 as const,
  SUCCESS: 2 as const,
  FAILURE: 3 as const,
};

export class Loader {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(_options: Record<string, any>) {}

  importLibrary(_name: string): Promise<MockPlacesLib> {
    const mockLib = window.__mockGoogleMapsLib;
    if (mockLib) {
      return Promise.resolve(mockLib);
    }
    // Default: no suggestions, no errors — component renders but stays idle
    return Promise.resolve({
      AutocompleteSessionToken: class {},
      AutocompleteSuggestion: {
        fetchAutocompleteSuggestions: async () => ({ suggestions: [] }),
      },
    } as unknown as MockPlacesLib);
  }
}
