// Mock for @googlemaps/js-api-loader
// Used in address-autocomplete.stories.tsx via vi.mock

export const mockSuggestions = [
  {
    placePrediction: {
      text: { text: "123 Main St, Beverly Hills, CA 90210, USA" },
      toPlace: () => ({
        fetchFields: async () => {},
        formattedAddress: "123 Main St, Beverly Hills, CA 90210, USA",
        addressComponents: [
          { types: ["postal_code"], longText: "90210" },
          { types: ["locality"], longText: "Beverly Hills" },
          { types: ["administrative_area_level_1"], longText: "California" },
        ],
      }),
    },
  },
  {
    placePrediction: {
      text: { text: "123 Main Ave, Los Angeles, CA 90001, USA" },
      toPlace: () => ({
        fetchFields: async () => {},
        formattedAddress: "123 Main Ave, Los Angeles, CA 90001, USA",
        addressComponents: [
          { types: ["postal_code"], longText: "90001" },
          { types: ["locality"], longText: "Los Angeles" },
          { types: ["administrative_area_level_1"], longText: "California" },
        ],
      }),
    },
  },
  {
    placePrediction: {
      text: { text: "123 Main Blvd, Santa Monica, CA 90401, USA" },
      toPlace: () => ({
        fetchFields: async () => {},
        formattedAddress: "123 Main Blvd, Santa Monica, CA 90401, USA",
        addressComponents: [
          { types: ["postal_code"], longText: "90401" },
          { types: ["locality"], longText: "Santa Monica" },
          { types: ["administrative_area_level_1"], longText: "California" },
        ],
      }),
    },
  },
];

// Mock Loader class that can be used as a module mock
export class MockLoader {
  constructor(_options: unknown) {}

  async importLibrary(_name: string) {
    return {
      AutocompleteSessionToken: class {},
      AutocompleteSuggestion: {
        fetchAutocompleteSuggestions: async (_params: unknown) => ({
          suggestions: mockSuggestions,
        }),
      },
    };
  }
}
