import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { ToastProvider, useToast } from "@/app/components/toast";

function ToastTrigger({
  type,
  message,
  label,
}: {
  type: "success" | "error" | "info";
  message: string;
  label: string;
}) {
  const { addToast } = useToast();
  return (
    <button
      onClick={() => addToast(type, message)}
      className="rounded-full bg-gray-900 text-white px-4 py-2 text-sm"
    >
      {label}
    </button>
  );
}

function MultiTrigger() {
  const { addToast } = useToast();
  return (
    <button
      onClick={() => {
        addToast("success", "First toast");
        addToast("error", "Second toast");
        addToast("info", "Third toast");
        addToast("success", "Fourth toast — should evict first");
      }}
      className="rounded-full bg-gray-900 text-white px-4 py-2 text-sm"
    >
      Add 4 Toasts
    </button>
  );
}

const meta = {
  title: "web/Components/Toast",
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => (
    <ToastTrigger
      type="success"
      message="Project saved successfully!"
      label="Add Success Toast"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Add Success Toast" }),
    );
    await waitFor(() => {
      expect(canvas.getByRole("alert")).toBeInTheDocument();
    });
    await expect(
      canvas.getByText("Project saved successfully!"),
    ).toBeInTheDocument();
  },
};

export const Error: Story = {
  render: () => (
    <ToastTrigger
      type="error"
      message="Failed to generate estimate"
      label="Add Error Toast"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Add Error Toast" }),
    );
    await waitFor(() => {
      expect(canvas.getByRole("alert")).toBeInTheDocument();
    });
    await expect(
      canvas.getByText("Failed to generate estimate"),
    ).toBeInTheDocument();
  },
};

export const Info: Story = {
  render: () => (
    <ToastTrigger
      type="info"
      message="Your estimate is being generated"
      label="Add Info Toast"
    />
  ),
};

export const DismissToast: Story = {
  render: () => (
    <ToastTrigger
      type="success"
      message="Click X to dismiss me"
      label="Add Toast"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add Toast" }));
    await waitFor(() => {
      expect(canvas.getByRole("alert")).toBeInTheDocument();
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Dismiss notification" }),
    );
    await waitFor(() => {
      expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    });
  },
};

export const MultipleToasts: Story = {
  render: () => <MultiTrigger />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add 4 Toasts" }));
    await waitFor(() => {
      expect(canvas.getAllByRole("alert")).toHaveLength(3);
    });
  },
};
