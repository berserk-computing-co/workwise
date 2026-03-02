import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { ThemeToggle } from "@/app/components/theme_toggle";

const meta = {
  title: "web/Components/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};

export const Dark: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const ToggleInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await expect(button).toBeInTheDocument();
    await expect(button.getAttribute("aria-label")).toBe("Switch to dark mode");

    await userEvent.click(button);

    await expect(button.getAttribute("aria-label")).toBe(
      "Switch to light mode",
    );
  },
};
