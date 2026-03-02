import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within, waitFor } from "storybook/test";
import { ProgressOverlay } from "@/app/components/progress-overlay";
import type { ProgressStep } from "@/app/hooks/use-job-progress";

const meta = {
  title: "web/Components/ProgressOverlay",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type MockState = {
  steps: ProgressStep[];
  isComplete: boolean;
  error: string | null;
};

/**
 * Set window.__mockJobProgress so the Vite-aliased useJobProgress hook returns
 * the desired state. The real hook uses native EventSource which MSW can't
 * intercept, so we replace it entirely at the module level via Vite alias.
 */
function setJobProgress(state: MockState) {
  window.__mockJobProgress = state;
  return () => {
    delete window.__mockJobProgress;
  };
}

function makeStory(state: MockState): Story {
  return {
    beforeEach: () => setJobProgress(state),
    render: () => (
      <ProgressOverlay jobId="mock-job-id" onComplete={fn()} onClose={fn()} />
    ),
  };
}

export const Connecting: Story = {
  ...makeStory({ steps: [], isComplete: false, error: null }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText("Setting everything up...")).toBeInTheDocument();
    });
    await expect(canvas.getByText("Generating Estimate")).toBeInTheDocument();
  },
};

export const ScopeRunning: Story = makeStory({
  steps: [
    {
      step: "scope_decomposition",
      status: "running",
      message: "Analyzing project scope...",
    },
  ],
  isComplete: false,
  error: null,
});

export const ThreeStepsDone: Story = makeStory({
  steps: [
    {
      step: "scope_decomposition",
      status: "completed",
      message: "Scope analyzed",
    },
    {
      step: "price_resolution",
      status: "completed",
      message: "Prices resolved",
    },
    {
      step: "web_price_resolution",
      status: "running",
      message: "Checking web...",
    },
  ],
  isComplete: false,
  error: null,
});

export const Complete: Story = {
  ...makeStory({
    steps: [
      { step: "scope_decomposition", status: "completed", message: "Done" },
      { step: "price_resolution", status: "completed", message: "Done" },
      { step: "web_price_resolution", status: "completed", message: "Done" },
      { step: "price_merge", status: "completed", message: "Done" },
      { step: "option_generation", status: "completed", message: "Done" },
      { step: "calculation", status: "completed", message: "Done" },
    ],
    isComplete: true,
    error: null,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText("Estimate ready!")).toBeInTheDocument();
    });
  },
};

export const ErrorState: Story = {
  ...makeStory({
    steps: [
      {
        step: "scope_decomposition",
        status: "completed",
        message: "Scope analyzed",
      },
      {
        step: "price_resolution",
        status: "error",
        message: "Failed to fetch prices",
      },
    ],
    isComplete: false,
    error: "Failed to fetch prices",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      // Text appears in both the error banner and the phase row — use getAllByText
      expect(
        canvas.getAllByText("Failed to fetch prices").length,
      ).toBeGreaterThan(0);
    });
    await expect(
      canvas.getByRole("button", { name: "Close" }),
    ).toBeInTheDocument();
  },
};
