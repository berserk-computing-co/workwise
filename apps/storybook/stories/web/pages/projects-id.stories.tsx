import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, waitFor, fireEvent } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import ProjectDetailPage from '@/app/(site)/projects/[id]/page';
import {
  mockProject,
  mockProjectWithSections,
} from '../../../.storybook/mocks/fixtures';

const meta = {
  title: 'web/Pages/ProjectDetail',
  component: ProjectDetailPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/projects/project-789',
        segments: { id: 'project-789' },
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
        http.get('/api/proxy/projects/:id', () =>
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
          'Full bathroom renovation including new tile flooring, vanity, and fixtures at a 3-bedroom home',
        ),
      ).toBeInTheDocument();
    });
  },
};

export const GeneratedProject: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/proxy/projects/:id', () =>
          HttpResponse.json(mockProjectWithSections),
        ),
        http.patch('/api/proxy/projects/:id', async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            ...mockProjectWithSections,
            id: params.id,
            ...body,
          });
        }),
        http.patch('/api/proxy/sections/:id', async ({ params, request }) => {
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
      expect(canvas.getByText('Bathroom Tile Work')).toBeInTheDocument();
    });
    await expect(canvas.getByText('Plumbing Fixtures')).toBeInTheDocument();
  },
};

export const GeneratingProject: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/projects/project-789',
        segments: { id: 'project-789' },
        searchParams: { generating: 'mock-job-id' },
      },
    },
    msw: {
      handlers: [
        http.get('/api/proxy/projects/:id', () =>
          HttpResponse.json({
            ...mockProject,
            status: 'generating',
            currentJobId: 'mock-job-id',
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText('Generating Estimate')).toBeInTheDocument();
    });
  },
};

export const InlineEditSectionName: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/proxy/projects/:id', () =>
          HttpResponse.json(mockProjectWithSections),
        ),
        http.patch('/api/proxy/sections/:id', async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            ...mockProjectWithSections.sections[0],
            id: params.id,
            name: (body as { name?: string }).name ?? 'Updated Section',
          });
        }),
        http.patch('/api/proxy/projects/:id', async ({ params, request }) => {
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
      expect(canvas.getByText('Bathroom Tile Work')).toBeInTheDocument();
    });
    const editButtons = canvas.getAllByRole('button', { name: /edit/i });
    if (editButtons.length > 0) {
      await userEvent.click(editButtons[0]);
      await waitFor(() => {
        const inputs = canvasElement.querySelectorAll("input[type='text']");
        expect(inputs.length).toBeGreaterThan(0);
      });
    }
  },
};

// ---------------------------------------------------------------------------
// Shared mobile viewport — forces responsive breakpoint below md (768px)
// ---------------------------------------------------------------------------

const mobileViewport = {
  viewport: {
    defaultViewport: 'iphone14',
    viewports: {
      iphone14: {
        name: 'iPhone 14',
        styles: { width: '390px', height: '844px' },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// MobileLayout — visual baseline: cards + section tabs, no desktop table
// ---------------------------------------------------------------------------

export const MobileLayout: Story = {
  parameters: {
    ...mobileViewport,
    msw: {
      handlers: [
        http.get('/api/proxy/projects/:id', () =>
          HttpResponse.json(mockProjectWithSections),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Section tab pill bar is visible at mobile viewport
    await waitFor(() => {
      expect(
        canvas.getByRole('button', { name: /Bathroom Tile Work/i }),
      ).toBeInTheDocument();
    });
    // Desktop table is hidden (display:none via `hidden md:block`)
    expect(canvas.queryByRole('table')).toBeNull();
    // Item appears as card text, not table cell
    expect(
      canvas.getByText('Remove existing tile flooring'),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// MobileSectionNavigation — tab bar renders all sections and is clickable
// ---------------------------------------------------------------------------

export const MobileSectionNavigation: Story = {
  parameters: {
    ...mobileViewport,
    msw: {
      handlers: [
        http.get('/api/proxy/projects/:id', () =>
          HttpResponse.json(mockProjectWithSections),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByRole('button', { name: /Bathroom Tile Work/i }),
      ).toBeInTheDocument();
    });
    expect(
      canvas.getByRole('button', { name: /Plumbing Fixtures/i }),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole('button', { name: /Plumbing Fixtures/i }),
    );
    // No crash — section name still in DOM after tab click
    await waitFor(() => {
      expect(canvas.getByText('Plumbing Fixtures')).toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// MobileItemEdit — Edit button opens bottom sheet; Save fires PATCH and closes
// ---------------------------------------------------------------------------

export const MobileItemEdit: Story = {
  parameters: {
    ...mobileViewport,
    msw: {
      handlers: [
        http.get('/api/proxy/projects/:id', () =>
          HttpResponse.json(mockProjectWithSections),
        ),
        http.patch(
          '/api/proxy/projects/:projectId/items/:itemId',
          async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json({
              ...mockProjectWithSections.sections[0].items[0],
              ...body,
            });
          },
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByText('Remove existing tile flooring'),
      ).toBeInTheDocument();
    });
    // Click the first "Edit item" button (opens bottom sheet)
    const editButtons = canvas.getAllByRole('button', { name: /edit item/i });
    await userEvent.click(editButtons[0]);
    // Bottom sheet slides up — Save Changes button appears
    await waitFor(() => {
      expect(
        canvas.getByRole('button', { name: /save changes/i }),
      ).toBeInTheDocument();
    });
    // Update the description textarea
    const textarea = canvasElement.querySelector('textarea');
    if (textarea) {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Updated description');
    }
    // Save — sheet closes after successful PATCH
    await userEvent.click(
      canvas.getByRole('button', { name: /save changes/i }),
    );
    await waitFor(() => {
      expect(
        canvas.queryByRole('button', { name: /save changes/i }),
      ).toBeNull();
    });
  },
};

// ---------------------------------------------------------------------------
// MobileSwipeDeleteItem — left-swipe past threshold triggers optimistic delete
// ---------------------------------------------------------------------------

export const MobileSwipeDeleteItem: Story = {
  parameters: {
    ...mobileViewport,
    msw: {
      // Use a closure counter so the refetch after delete returns data
      // without item-1, keeping the item gone after optimistic removal.
      handlers: (() => {
        let fetchCount = 0;
        const mockAfterDelete = {
          ...mockProjectWithSections,
          sections: mockProjectWithSections.sections.map((s) =>
            s.id === 'section-1'
              ? { ...s, items: s.items.filter((i) => i.id !== 'item-1') }
              : s,
          ),
        };
        return [
          http.get('/api/proxy/projects/:id', () => {
            fetchCount++;
            return fetchCount === 1
              ? HttpResponse.json(mockProjectWithSections)
              : HttpResponse.json(mockAfterDelete);
          }),
          http.delete('/api/proxy/projects/:projectId/items/:itemId', () =>
            HttpResponse.json({}),
          ),
        ];
      })(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByText('Remove existing tile flooring'),
      ).toBeInTheDocument();
    });
    // Swipe the item row left past the 60px delete threshold (90px swipe)
    const itemText = canvas.getByText('Remove existing tile flooring');
    fireEvent.touchStart(itemText, {
      touches: [{ clientX: 250, clientY: 0 }],
    });
    fireEvent.touchMove(itemText, {
      touches: [{ clientX: 160, clientY: 0 }],
    });
    fireEvent.touchEnd(itemText, {
      changedTouches: [{ clientX: 160, clientY: 0 }],
    });
    // Swipe exceeds threshold → onDelete() fires → optimistic removal
    await waitFor(() => {
      expect(canvas.queryByText('Remove existing tile flooring')).toBeNull();
    });
  },
};
