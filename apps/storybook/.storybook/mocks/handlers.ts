import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockOrganization,
  mockProjectWithSections,
  mockPaginatedProjects,
} from './fixtures';

export const handlers = [
  // Users
  http.get('/api/proxy/users/me', () => {
    return HttpResponse.json(mockUser);
  }),

  // Organizations
  http.get('/api/proxy/organizations/me', () => {
    return HttpResponse.json(mockOrganization);
  }),

  http.patch('/api/proxy/organizations/me', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockOrganization, ...body });
  }),

  http.post('/api/proxy/organizations/me/logo', () => {
    return HttpResponse.json({
      logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    });
  }),

  // Projects list
  http.get('/api/proxy/projects', () => {
    return HttpResponse.json(mockPaginatedProjects);
  }),

  // Single project
  http.get('/api/proxy/projects/:id', ({ params }) => {
    return HttpResponse.json({
      ...mockProjectWithSections,
      id: params.id as string,
    });
  }),

  // Create project
  http.post('/api/proxy/projects', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ...mockProjectWithSections,
        id: 'new-project-id',
        description:
          (body as { description?: string }).description ?? 'New project',
        status: 'draft',
        total: 0,
        sections: [],
        options: [],
      },
      { status: 201 },
    );
  }),

  // Generate project
  http.post('/api/proxy/projects/:id/generate', () => {
    return HttpResponse.json({ jobId: 'mock-job-id' });
  }),

  // Update project
  http.patch('/api/proxy/projects/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ...mockProjectWithSections,
      id: params.id as string,
      ...body,
    });
  }),

  // Sections
  http.post('/api/proxy/projects/:id/sections', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'new-section-id',
        name: (body as { name?: string }).name ?? 'New Section',
        projectId: params.id as string,
        subtotal: 0,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.patch('/api/proxy/sections/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: params.id as string,
      name: 'Updated Section',
      ...body,
    });
  }),

  http.delete('/api/proxy/sections/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Items
  http.post('/api/proxy/items', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'new-item-id',
        description:
          (body as { description?: string }).description ?? 'New item',
        quantity: (body as { quantity?: number }).quantity ?? 1,
        unit: (body as { unit?: string }).unit ?? 'ea',
        unitCost: (body as { unitCost?: number }).unitCost ?? 0,
        extendedCost: 0,
        source: null,
        sectionId: (body as { sectionId?: string }).sectionId ?? '',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.patch('/api/proxy/items/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: params.id as string,
      ...body,
    });
  }),

  http.delete('/api/proxy/items/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
