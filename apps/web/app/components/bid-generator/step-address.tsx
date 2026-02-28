"use client";

import { useCallback, useState } from "react";
import Script from "next/script";
import GooglePlacesAutocomplete, {
  geocodeByPlaceId,
} from "react-google-places-autocomplete";
import { useTheme } from "@/app/lib/theme/context";
import { BotCard } from "./bot-card";

export function Step1Address({
  onNext,
}: {
  onNext: (payload: {
    address: string;
    formattedAddress: string;
    zipCode: string;
  }) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [value, setValue] = useState<{
    label: string;
    value: { place_id: string };
  } | null>(null);
  const [picking, setPicking] = useState(false);

  const handleSelect = useCallback(
    async (
      selected: { label: string; value: { place_id: string } } | null,
    ) => {
      if (!selected) return;
      setValue(selected);
      setPicking(true);
      try {
        const results = await geocodeByPlaceId(selected.value.place_id);
        const result = results[0];
        const formattedAddress = result.formatted_address;

        let zipCode = "";
        for (const component of result.address_components) {
          if (component.types.includes("postal_code")) {
            zipCode = component.long_name;
            break;
          }
        }

        onNext({
          address: selected.label,
          formattedAddress,
          zipCode,
        });
      } catch {
        // stay on step
      } finally {
        setPicking(false);
      }
    },
    [onNext],
  );

  return (
    <div className="space-y-3">
      <BotCard
        title="Where's the project?"
        subtitle="Enter the project address to get started."
      />
      <div className="bg-white dark:bg-[#0f0f12] border border-gray-100 dark:border-gray-800 rounded-xl p-4">
        {mapsLoaded ? (
          <GooglePlacesAutocomplete
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            selectProps={{
              value,
              onChange: handleSelect,
              placeholder: "Start typing an address...",
              isClearable: true,
              isDisabled: picking,
              classNamePrefix: "gpa",
              styles: {
                control: (base) => ({
                  ...base,
                  border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  boxShadow: "none",
                  padding: "2px 4px",
                  backgroundColor: "transparent",
                  "&:hover": { borderColor: isDark ? "#6b7280" : "#9ca3af" },
                }),
                input: (base) => ({ ...base, color: "inherit" }),
                singleValue: (base) => ({ ...base, color: "inherit" }),
                placeholder: (base) => ({
                  ...base,
                  color: isDark ? "#6b7280" : "#9ca3af",
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 50,
                  borderRadius: "0.75rem",
                  border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                  backgroundColor: isDark ? "#1a1a1e" : "white",
                  boxShadow: isDark
                    ? "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)"
                    : "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused
                    ? isDark
                      ? "#374151"
                      : "#f9fafb"
                    : isDark
                      ? "#1a1a1e"
                      : "white",
                  color: isDark ? "#f3f4f6" : "#111827",
                  cursor: "pointer",
                }),
              },
            }}
          />
        ) : (
          <input
            type="text"
            disabled
            placeholder="Loading address search..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500 bg-transparent"
          />
        )}
        {picking && (
          <p className="mt-2 text-xs text-gray-400">
            Fetching address details...
          </p>
        )}
      </div>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />
    </div>
  );
}
