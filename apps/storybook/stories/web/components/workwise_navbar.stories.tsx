import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { http, HttpResponse } from "msw";
import { WorkWiseNavbar } from "@/app/components/workwise_navbar";
import {
  mockAuth0User,
  mockAuth0UserNoPicture,
} from "../../../.storybook/mocks/auth0";

const meta = {
  title: "web/Components/WorkWiseNavbar",
  component: WorkWiseNavbar,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects" },
    },
  },
} satisfies Meta<typeof WorkWiseNavbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Authenticated: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/users/me", () =>
          HttpResponse.json({ id: "user-1", firstName: "James" }),
        ),
        http.get("/api/proxy/organizations/me", () =>
          HttpResponse.json({ id: "org-1", name: "WorkWise Contracting" }),
        ),
      ],
    },
    nextjs: {
      appDirectory: true,
      auth: { user: mockAuth0User },
    },
  },
};

export const AuthenticatedNoPicture: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/users/me", () =>
          HttpResponse.json({ id: "user-1", firstName: "Alex" }),
        ),
      ],
    },
    nextjs: {
      appDirectory: true,
      auth: { user: mockAuth0UserNoPicture },
    },
  },
};

export const Unauthenticated: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      auth: { user: null },
    },
  },
};

export const ProfileDropdown: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/users/me", () =>
          HttpResponse.json({ id: "user-1", firstName: "James" }),
        ),
        http.get("/api/proxy/organizations/me", () =>
          HttpResponse.json({ id: "org-1", name: "WorkWise Contracting" }),
        ),
      ],
    },
    nextjs: {
      appDirectory: true,
      auth: { user: mockAuth0User },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvasElement.querySelector("nav")).toBeInTheDocument();
    });
    const buttons = canvas.getAllByRole("button");
    await userEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(canvas.getByText(mockAuth0User.name)).toBeInTheDocument();
    });
    await expect(canvas.getByText(mockAuth0User.email)).toBeInTheDocument();
    await expect(canvas.getByText("Dashboard")).toBeInTheDocument();
    await expect(canvas.getByText("Sign out")).toBeInTheDocument();
  },
};
