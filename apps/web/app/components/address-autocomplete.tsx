"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/app/lib/theme/context";

// Loader is created once at module level to avoid re-instantiation and dedup requests
const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: "weekly",
});

export interface AddressResult {
  address: string;
  formattedAddress: string;
  zipCode: string;
}

interface AddressAutocompleteProps {
  onSelect: (result: AddressResult) => void;
  disabled?: boolean;
}

export function AddressAutocomplete({
  onSelect,
  disabled,
}: AddressAutocompleteProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const placesRef = useRef<google.maps.PlacesLibrary | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the Places library once on mount
  useEffect(() => {
    loader.importLibrary("places").then((places) => {
      placesRef.current = places;
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    });
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!placesRef.current || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    try {
      const result =
        await placesRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          {
            input: query,
            sessionToken: sessionTokenRef.current!,
          },
        );
      setSuggestions(result.suggestions);
      setOpen(result.suggestions.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (
    suggestion: google.maps.places.AutocompleteSuggestion,
  ) => {
    setLoading(true);
    setOpen(false);
    setSuggestions([]);
    try {
      const place = suggestion.placePrediction!.toPlace();
      await place.fetchFields({
        fields: ["formattedAddress", "addressComponents"],
      });
      const zipCode =
        place.addressComponents?.find((c) => c.types.includes("postal_code"))
          ?.longText ?? "";
      const addressText = suggestion.placePrediction!.text.text;
      setInputValue(addressText);
      onSelect({
        address: addressText,
        formattedAddress: place.formattedAddress ?? addressText,
        zipCode,
      });
      // Reset session token after selection (billing best practice)
      if (placesRef.current) {
        sessionTokenRef.current =
          new placesRef.current.AutocompleteSessionToken();
      }
    } catch {
      // stay on step
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleBlur = () => {
    // Slight delay so onMouseDown on a suggestion fires before blur closes the list
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled || loading}
        placeholder="Start typing an address..."
        autoComplete="off"
        className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 transition-colors ${
          isDark
            ? "border-gray-700 text-gray-100 placeholder:text-gray-500 focus:ring-white/10 hover:border-gray-500"
            : "border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-gray-900/10 hover:border-gray-400"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {loading && (
        <p className="mt-2 text-xs text-gray-400">
          Fetching address details...
        </p>
      )}
      {open && suggestions.length > 0 && (
        <ul
          className={`absolute z-50 w-full mt-1 rounded-xl border overflow-hidden ${
            isDark
              ? "border-gray-700 bg-[#1a1a1e] shadow-[0_10px_15px_-3px_rgb(0_0_0/0.3),0_4px_6px_-4px_rgb(0_0_0/0.3)]"
              : "border-gray-200 bg-white shadow-[0_10px_15px_-3px_rgb(0_0_0/0.1),0_4px_6px_-4px_rgb(0_0_0/0.1)]"
          }`}
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                // Prevent input blur from firing before click
                e.preventDefault();
                handleSelect(s);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                isDark
                  ? "text-gray-100 hover:bg-gray-700"
                  : "text-gray-900 hover:bg-gray-50"
              }`}
            >
              {s.placePrediction?.text.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
