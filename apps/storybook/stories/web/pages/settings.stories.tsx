import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import SettingsPage from '@/app/(site)/settings/page';
import { mockOrganization } from '../../../.storybook/mocks/fixtures';

const meta = {
  title: 'web/Pages/Settings',
  component: SettingsPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/settings' },
    },
  },
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByLabelText('Company Name')).toHaveValue(
        mockOrganization.name,
      );
    });
    expect(
      canvas.getByRole('button', { name: /save changes/i }),
    ).toBeDisabled();
    expect(canvas.getByText('Sending Domain')).toBeInTheDocument();
  },
};

export const SaveProfile: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByLabelText('Company Name')).toHaveValue(
        mockOrganization.name,
      );
    });
    await userEvent.type(canvas.getByLabelText('Phone'), '(555) 123-4567');
    await userEvent.type(
      canvas.getByLabelText('Website'),
      'https://workwise.io',
    );
    await userEvent.type(canvas.getByLabelText('License Number'), 'CSLB #999');
    const saveButton = canvas.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(canvas.getByText('Settings saved')).toBeInTheDocument();
    });
  },
};

export const SaveProfileError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/proxy/users/me', () =>
          HttpResponse.json({ id: 'user-1', firstName: 'James' }),
        ),
        http.get('/api/proxy/organizations/me', () =>
          HttpResponse.json(mockOrganization),
        ),
        http.patch('/api/proxy/organizations/me', () =>
          HttpResponse.json(
            { message: 'Validation failed: name too long' },
            { status: 422 },
          ),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByLabelText('Company Name')).toHaveValue(
        mockOrganization.name,
      );
    });
    await userEvent.type(canvas.getByLabelText('Phone'), '555');
    await userEvent.click(
      canvas.getByRole('button', { name: /save changes/i }),
    );
    await waitFor(() => {
      expect(
        canvas.getByText('Validation failed: name too long'),
      ).toBeInTheDocument();
    });
  },
};

export const RequiredName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Wait for org data to populate the form
    await waitFor(() => {
      expect(canvas.getByLabelText('Company Name')).toHaveValue(
        mockOrganization.name,
      );
    });
    await userEvent.clear(canvas.getByLabelText('Company Name'));
    // After clearing, isDirty is true so Save is enabled
    await userEvent.click(
      canvas.getByRole('button', { name: /save changes/i }),
    );
    await waitFor(() => {
      expect(canvas.getByText('Company name is required')).toBeInTheDocument();
    });
  },
};

export const UploadLogo: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByRole('button', { name: /upload logo/i }),
      ).toBeInTheDocument();
    });
    const fileInput = canvasElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(canvas.getByText('Logo uploaded')).toBeInTheDocument();
    });
  },
};

export const UploadLogoError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/proxy/users/me', () =>
          HttpResponse.json({ id: 'user-1', firstName: 'James' }),
        ),
        http.get('/api/proxy/organizations/me', () =>
          HttpResponse.json(mockOrganization),
        ),
        http.post('/api/proxy/organizations/me/logo', () =>
          HttpResponse.json({ message: 'File too large' }, { status: 413 }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.getByRole('button', { name: /upload logo/i }),
      ).toBeInTheDocument();
    });
    const fileInput = canvasElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['x'.repeat(3_000_000)], 'huge.png', {
      type: 'image/png',
    });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(canvas.getByText('File too large')).toBeInTheDocument();
    });
  },
};
