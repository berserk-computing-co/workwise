import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import { BidGenerator } from '@/app/components/bid-generator/bid-generator';

const meta = {
  title: 'web/Components/BidGenerator',
  component: BidGenerator,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/' },
      auth: {
        user: {
          sub: 'auth0|user123',
          name: 'James McDougall',
          email: 'james@workwise.io',
        },
      },
    },
    msw: {
      handlers: [
        http.post('/api/proxy/projects', async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            { id: 'new-project-id', description: body.description },
            { status: 201 },
          );
        }),
        http.post('/api/proxy/projects/:id/generate', () => {
          return HttpResponse.json({ jobId: 'mock-job-id' });
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

// Note: FullFlowInteraction cannot drive the address autocomplete dropdown
// because step-address.tsx uses react-google-places-autocomplete which loads
// the Google Maps JS API via its own script tag (not @googlemaps/js-api-loader).
// This story only verifies the initial step heading renders correctly.
export const FullFlowInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText("Where's the project?")).toBeInTheDocument();
    });
  },
};
