import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import { AddressAutocomplete } from "@/app/components/address-autocomplete";
import { mockSuggestions } from "../../../.storybook/mocks/google-maps";

const meta = {
  title: "web/Components/AddressAutocomplete",
  component: AddressAutocomplete,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AddressAutocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Set window.__mockGoogleMapsLib before a story renders so the Vite-aliased
 * Loader mock returns the fixture suggestions. Returns a cleanup function that
 * removes the global after the story unmounts.
 */
function setMockLib() {
  window.__mockGoogleMapsLib = {
    AutocompleteSessionToken: class {},
    AutocompleteSuggestion: {
      fetchAutocompleteSuggestions: async () => ({
        suggestions: mockSuggestions,
      }),
    },
  };
  return () => {
    delete window.__mockGoogleMapsLib;
  };
}

export const Idle: Story = {
  args: {
    onSelect: fn(),
  },
};

export const Disabled: Story = {
  args: {
    onSelect: fn(),
    disabled: true,
  },
};

export const WithSuggestions: Story = {
  args: {
    onSelect: fn(),
  },
  beforeEach: setMockLib,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("Start typing an address..."),
      "123 Main",
    );
    await waitFor(
      () => {
        expect(
          canvas.getByText("123 Main St, Beverly Hills, CA 90210, USA"),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

export const SelectSuggestion: Story = {
  args: {
    onSelect: fn(),
  },
  beforeEach: setMockLib,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("Start typing an address..."),
      "123 Main",
    );
    await waitFor(
      () => {
        expect(
          canvas.getByText("123 Main St, Beverly Hills, CA 90210, USA"),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    await userEvent.click(
      canvas.getByText("123 Main St, Beverly Hills, CA 90210, USA"),
    );
    await waitFor(() => {
      expect(args.onSelect).toHaveBeenCalled();
    });
  },
};
