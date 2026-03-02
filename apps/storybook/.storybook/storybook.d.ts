/**
 * Global window augmentations used by story beforeEach hooks to pass mock
 * state to Vite-aliased module replacements.
 */
interface Window {
  /** Set by address-autocomplete and bid_generator stories */
  __mockGoogleMapsLib?: {
    AutocompleteSessionToken: new () => object;
    AutocompleteSuggestion: {
      fetchAutocompleteSuggestions: (
        params: unknown,
      ) => Promise<{ suggestions: unknown[] }>;
    };
  };
  /** Set by progress-overlay and projects-id stories */
  __mockJobProgress?: {
    steps: Array<{
      step: string;
      status: "pending" | "running" | "complete" | "completed" | "error";
      message: string;
      total?: number;
    }>;
    isComplete: boolean;
    error: string | null;
  };
}
