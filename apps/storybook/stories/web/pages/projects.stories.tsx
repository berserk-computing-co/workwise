import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { http, HttpResponse } from "msw";
import ProjectsPage from "@/app/(site)/projects/page";
import { mockPaginatedProjects } from "../../../.storybook/mocks/fixtures";
import type { PaginatedResponse, Project } from "@/app/types/project-api";

const emptyResponse: PaginatedResponse<Project> = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, pages: 0 },
};

const meta = {
  title: "web/Pages/Projects",
  component: ProjectsPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects" },
    },
  },
} satisfies Meta<typeof ProjectsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithProjects: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/projects", () =>
          HttpResponse.json(mockPaginatedProjects),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByText(
          "Kitchen renovation with new cabinets and countertops",
        ),
      ).toBeInTheDocument();
    });
  },
};

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/projects", () => HttpResponse.json(emptyResponse)),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByText("Generate your first estimate"),
      ).toBeInTheDocument();
    });
  },
};

export const Generating: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/projects", () =>
          HttpResponse.json({
            ...mockPaginatedProjects,
            data: mockPaginatedProjects.data.filter(
              (p) => p.status === "generating",
            ),
          }),
        ),
      ],
    },
  },
};

export const FilterByStatus: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/projects", ({ request }) => {
          const url = new URL(request.url);
          const status = url.searchParams.get("status");
          const filtered = status
            ? mockPaginatedProjects.data.filter((p) => p.status === status)
            : mockPaginatedProjects.data;
          return HttpResponse.json({
            data: filtered,
            meta: { total: filtered.length, page: 1, limit: 20, pages: 1 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByRole("button", { name: "Review" }),
      ).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByRole("button", { name: "Review" }));
    await waitFor(() => {
      expect(
        canvas.getByText(
          "Kitchen renovation with new cabinets and countertops",
        ),
      ).toBeInTheDocument();
    });
  },
};
