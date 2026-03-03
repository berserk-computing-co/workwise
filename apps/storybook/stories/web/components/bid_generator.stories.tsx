import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import { http, HttpResponse } from "msw";
import { BidGenerator } from "@/app/components/bid_generator";

const meta = {
  title: "web/Components/BidGenerator",
  component: BidGenerator,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/" },
      auth: {
        user: {
          sub: "auth0|user123",
          name: "James McDougall",
          email: "james@workwise.io",
        },
      },
    },
    msw: {
      handlers: [
        http.post("/api/proxy/projects", async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            { id: "new-project-id", description: body.description },
            { status: 201 },
          );
        }),
        http.post("/api/proxy/projects/:id/generate", () => {
          return HttpResponse.json({ jobId: "mock-job-id" });
        }),
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BidGenerator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1Address: Story = {};

export const Unauthenticated: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      auth: { user: null },
    },
  },
};

export const FullFlowInteraction: Story = {
  beforeEach: () => {
    window.__mockGoogleMapsLib = {
      AutocompleteSessionToken: class {},
      AutocompleteSuggestion: {
        fetchAutocompleteSuggestions: async () => ({
          suggestions: [
            {
              placePrediction: {
                text: { text: "123 Main St, Beverly Hills, CA 90210" },
                toPlace: () => ({
                  fetchFields: async () => {},
                  formattedAddress: "123 Main St, Beverly Hills, CA 90210",
                  addressComponents: [
                    { types: ["postal_code"], longText: "90210" },
                  ],
                }),
              },
            },
          ],
        }),
      },
    };
    return () => {
      delete window.__mockGoogleMapsLib;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByPlaceholderText("Start typing an address..."),
      "123 Main",
    );
    await waitFor(() => {
      expect(
        canvas.getByText("123 Main St, Beverly Hills, CA 90210"),
      ).toBeInTheDocument();
    });
    await userEvent.click(
      canvas.getByText("123 Main St, Beverly Hills, CA 90210"),
    );

    await waitFor(() => {
      expect(
        canvas.getByText("Describe the scope of work."),
      ).toBeInTheDocument();
    });

    await userEvent.type(
      canvas.getByPlaceholderText(/Describe the scope/i),
      "Full bathroom renovation including tile work, vanity replacement, and fixture updates throughout the space.",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(canvas.getByText("Who's this estimate for?")).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByRole("button", { name: "Skip" }));

    await waitFor(() => {
      expect(
        canvas.getByText("Ready to build your estimate."),
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: "Build My Estimate" }),
    ).toBeInTheDocument();
  },
};
