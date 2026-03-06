import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from './mock-db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockHandlerOptions {
  defaultLatency?: number;
}

type RouteHandler = (
  req: NextRequest,
  params: Record<string, string>,
) => NextResponse | Promise<NextResponse>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function route(method: string, path: string, handler: RouteHandler): Route {
  // Convert "/projects/:id/sections" → regex with named groups
  const paramNames: string[] = [];
  const regexStr = path.replace(/:([a-zA-Z]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return {
    method,
    pattern: new RegExp(`^${regexStr}$`),
    paramNames,
    handler,
  };
}

function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

function notFound(resource = 'Resource'): NextResponse {
  return json(
    { errors: [{ description: `${resource} not found`, pointer: 'id' }] },
    404,
  );
}

function errorResponse(status: number): NextResponse {
  const messages: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not found',
    422: 'Validation failed',
    500: 'Internal server error',
  };
  return json(
    {
      errors: [
        {
          description: messages[status] ?? `Error ${status}`,
          pointer: 'request',
        },
      ],
    },
    status,
  );
}

async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

const routes: Route[] = [
  // Auth setup
  route('POST', '/auth/setup', () => {
    return json(mockDb.authSetup());
  }),

  // Users
  route('GET', '/users/me', () => {
    return json(mockDb.getUser());
  }),

  // Organizations
  route('GET', '/organizations/me', () => {
    return json(mockDb.getOrganization());
  }),

  // Projects - list
  route('GET', '/projects', (req) => {
    const url = req.nextUrl;
    const result = mockDb.listProjects({
      page: url.searchParams.has('page')
        ? Number(url.searchParams.get('page'))
        : undefined,
      limit: url.searchParams.has('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
      status: url.searchParams.get('status') ?? undefined,
    });
    return json(result);
  }),

  // Projects - create
  route('POST', '/projects', async (req) => {
    const body = await parseBody(req);
    const project = mockDb.createProject(body);
    return json(project, 201);
  }),

  // Projects - single
  route('GET', '/projects/:id', (_req, params) => {
    const project = mockDb.getProject(params.id);
    if (!project) return notFound('Project');
    return json(project);
  }),

  // Projects - update
  route('PATCH', '/projects/:id', async (req, params) => {
    const body = await parseBody(req);
    const project = mockDb.updateProject(params.id, body);
    if (!project) return notFound('Project');
    return json(project);
  }),

  // Projects - delete
  route('DELETE', '/projects/:id', (_req, params) => {
    const deleted = mockDb.deleteProject(params.id);
    if (!deleted) return notFound('Project');
    return noContent();
  }),

  // Projects - generate
  route('POST', '/projects/:id/generate', (_req, params) => {
    const result = mockDb.startGenerate(params.id);
    if (!result) return notFound('Project');
    return json(result);
  }),

  // Projects - duplicate
  route('POST', '/projects/:id/duplicate', (_req, params) => {
    const project = mockDb.duplicateProject(params.id);
    if (!project) return notFound('Project');
    return json(project, 201);
  }),

  // Projects - recalculate
  route('POST', '/projects/:id/recalculate', (_req, params) => {
    const project = mockDb.recalculate(params.id);
    if (!project) return notFound('Project');
    return json(project);
  }),

  // Sections - create
  route('POST', '/projects/:id/sections', async (req, params) => {
    const body = await parseBody(req);
    const section = mockDb.createSection(params.id, body);
    if (!section) return notFound('Project');
    return json(section, 201);
  }),

  // Sections - update
  route('PATCH', '/projects/:projectId/sections/:id', async (req, params) => {
    const body = await parseBody(req);
    const section = mockDb.updateSection(params.id, body);
    if (!section) return notFound('Section');
    return json(section);
  }),

  // Sections - delete
  route('DELETE', '/projects/:projectId/sections/:id', (_req, params) => {
    const deleted = mockDb.deleteSection(params.id);
    if (!deleted) return notFound('Section');
    return noContent();
  }),

  // Items - create
  route('POST', '/projects/:projectId/items', async (req) => {
    const body = await parseBody(req);
    const item = mockDb.createItem(body);
    if (!item) return notFound('Section');
    return json(item, 201);
  }),

  // Items - update
  route('PATCH', '/projects/:projectId/items/:id', async (req, params) => {
    const body = await parseBody(req);
    const item = mockDb.updateItem(params.id, body);
    if (!item) return notFound('Item');
    return json(item);
  }),

  // Items - delete
  route('DELETE', '/projects/:projectId/items/:id', (_req, params) => {
    const deleted = mockDb.deleteItem(params.id);
    if (!deleted) return notFound('Item');
    return noContent();
  }),

  // Items - reorder
  route('POST', '/projects/:projectId/items/reorder', async (req) => {
    const body = await parseBody(req);
    const items = mockDb.reorderItems(
      body.sectionId as string,
      body.itemIds as string[],
    );
    if (!items) return notFound('Section');
    return json(items);
  }),

  // Options - update
  route('PATCH', '/projects/:projectId/options/:id', async (req, params) => {
    const body = await parseBody(req);
    const option = mockDb.updateOption(params.id, body);
    if (!option) return notFound('Option');
    return json(option);
  }),

  // Mock admin - reset
  route('DELETE', '/_mock/reset', () => {
    mockDb.reset();
    return json({ ok: true });
  }),
];

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handleMockRequest(
  req: NextRequest,
  pathSegments: string[],
  options: MockHandlerOptions = {},
): Promise<NextResponse> {
  const path = '/' + pathSegments.join('/');
  const method = req.method;

  // Check for forced error
  const mockError = req.nextUrl.searchParams.get('_mockError');
  if (mockError) {
    const status = parseInt(mockError, 10) || 500;
    const latency =
      parseInt(req.nextUrl.searchParams.get('_mockLatency') ?? '', 10) ||
      options.defaultLatency ||
      100;
    await sleep(latency);
    return errorResponse(status);
  }

  // Simulate latency
  const latency =
    parseInt(req.nextUrl.searchParams.get('_mockLatency') ?? '', 10) ||
    options.defaultLatency ||
    300;
  await sleep(latency);

  // Match route
  for (const r of routes) {
    if (r.method !== method) continue;
    const match = path.match(r.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    r.paramNames.forEach((name, i) => {
      params[name] = match[i + 1];
    });

    return r.handler(req, params);
  }

  // No route matched
  return json(
    {
      errors: [
        {
          description: `Mock handler: no route for ${method} ${path}`,
          pointer: 'path',
        },
      ],
    },
    501,
  );
}
