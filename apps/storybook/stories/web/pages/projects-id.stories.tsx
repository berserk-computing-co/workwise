import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { http, HttpResponse } from "msw";
import ProjectDetailPage from "@/app/(site)/projects/[id]/page";
import {
  mockProject,
  mockProjectWithSections,
} from "../../../.storybook/mocks/fixtures";

const meta = {
  title: "web/Pages/ProjectDetail",
  component: ProjectDetailPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/projects/project-789",
        segments: { id: "project-789" },
      },
    },
  },
} satisfies Meta<typeof ProjectDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DraftProject: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/projects/:id", () =>
          HttpResponse.json(mockProject),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByText(
          "Full bathroom renovation including new tile flooring, vanity, and fixtures at a 3-bedroom home",
        ),
      ).toBeInTheDocument();
    });
  },
};

export const GeneratedProject: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/projects/:id", () =>
          HttpResponse.json(mockProjectWithSections),
        ),
        http.patch("/api/proxy/projects/:id", async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            ...mockProjectWithSections,
            id: params.id,
            ...body,
          });
        }),
        http.patch("/api/proxy/sections/:id", async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            ...mockProjectWithSections.sections[0],
            id: params.id,
            ...body,
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText("Bathroom Tile Work")).toBeInTheDocument();
    });
    await expect(canvas.getByText("Plumbing Fixtures")).toBeInTheDocument();
  },
};

export const GeneratingProject: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/projects/project-789",
        segments: { id: "project-789" },
        searchParams: { generating: "mock-job-id" },
      },
    },
    msw: {
      handlers: [
        http.get("/api/proxy/projects/:id", () =>
          HttpResponse.json({
            ...mockProject,
            status: "generating",
            currentJobId: "mock-job-id",
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText("Generating Estimate")).toBeInTheDocument();
    });
  },
};

export const InlineEditSectionName: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/proxy/projects/:id", () =>
          HttpResponse.json(mockProjectWithSections),
        ),
        http.patch("/api/proxy/sections/:id", async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            ...mockProjectWithSections.sections[0],
            id: params.id,
            name: (body as { name?: string }).name ?? "Updated Section",
          });
        }),
        http.patch("/api/proxy/projects/:id", async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            ...mockProjectWithSections,
            id: params.id,
            ...body,
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText("Bathroom Tile Work")).toBeInTheDocument();
    });
    const editButtons = canvas.getAllByRole("button", { name: /edit/i });
    if (editButtons.length > 0) {
      await userEvent.click(editButtons[0]);
      await waitFor(() => {
        const inputs = canvasElement.querySelectorAll("input[type='text']");
        expect(inputs.length).toBeGreaterThan(0);
      });
    }
  },
};
