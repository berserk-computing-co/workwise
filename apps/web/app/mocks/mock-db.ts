import type {
  User,
  Organization,
  Section,
  Item,
  PaginatedResponse,
  AuthSetupResponse,
} from '@/app/types/project-api';
import type { Option, Project, ProjectStatus } from '@/app/types/project-api';
import {
  mockUser,
  mockOrganization,
  mockPaginatedProjects,
  mockProjectWithSections,
} from './fixtures';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockStore {
  user: User;
  organization: Organization;
  projects: Project[];
  nextId: number;
}

// ---------------------------------------------------------------------------
// Singleton store — survives Next.js HMR via globalThis
// ---------------------------------------------------------------------------

const GLOBAL_KEY = '__mockDb' as const;

declare global {
  // eslint-disable-next-line no-var
  var __mockDb: MockStore | undefined;
}

function createStore(): MockStore {
  // Deep-clone fixtures so mutations don't affect the originals
  const projects = structuredClone(mockPaginatedProjects.data);

  // Give the first "review" project real sections/options for detail view
  const reviewProject = projects.find((p) => p.status === 'review');
  if (reviewProject) {
    const withSections = structuredClone(mockProjectWithSections);
    reviewProject.sections = withSections.sections;
    reviewProject.options = withSections.options;
    // Fix references so section/option projectIds match
    for (const s of reviewProject.sections) {
      s.projectId = reviewProject.id;
      for (const item of s.items) {
        item.sectionId = s.id;
      }
    }
    for (const o of reviewProject.options) {
      o.projectId = reviewProject.id;
    }
  }

  return {
    user: structuredClone(mockUser),
    organization: structuredClone(mockOrganization),
    projects,
    nextId: 100,
  };
}

function getStore(): MockStore {
  if (!globalThis.__mockDb) {
    globalThis.__mockDb = createStore();
  }
  return globalThis.__mockDb;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(prefix: string): string {
  const store = getStore();
  return `${prefix}-${store.nextId++}`;
}

function now(): string {
  return new Date().toISOString();
}

function recalculateProject(project: Project): void {
  for (const section of project.sections) {
    section.subtotal = section.items.reduce(
      (sum, item) => sum + item.extendedCost,
      0,
    );
  }
  const baseTotal = project.sections.reduce((sum, s) => sum + s.subtotal, 0);
  project.total = baseTotal;

  // Recalculate option totals based on multiplier
  for (const option of project.options) {
    option.total = Math.round(baseTotal * option.multiplier);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const mockDb = {
  // -- Auth / User ----------------------------------------------------------

  getUser(): User {
    return getStore().user;
  },

  getOrganization(): Organization {
    return getStore().organization;
  },

  authSetup(): AuthSetupResponse {
    const store = getStore();
    return { user: store.user, organization: store.organization };
  },

  // -- Projects -------------------------------------------------------------

  listProjects(params: {
    page?: number;
    limit?: number;
    status?: string;
  }): PaginatedResponse<Project> {
    const store = getStore();
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    let filtered = store.projects.filter((p) => !p.deletedAt);
    if (params.status) {
      filtered = filtered.filter((p) => p.status === params.status);
    }

    // Sort by createdAt descending (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = filtered.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return { data, meta: { total, page, limit, pages } };
  },

  getProject(id: string): Project | null {
    const store = getStore();
    return store.projects.find((p) => p.id === id && !p.deletedAt) ?? null;
  },

  createProject(body: Record<string, unknown>): Project {
    const store = getStore();
    const project: Project = {
      id: genId('project'),
      organizationId: store.organization.id,
      createdBy: store.user.id,
      status: 'draft' as ProjectStatus,
      description: (body.description as string) ?? '',
      category: (body.category as string) ?? '',
      address: (body.address as string) ?? '',
      zipCode: (body.zipCode as string) ?? '',
      city: (body.city as string) ?? null,
      state: (body.state as string) ?? null,
      clientName: (body.clientName as string) ?? null,
      total: 0,
      currentJobId: null,
      metadata: {},
      sections: [],
      options: [],
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null,
    };
    store.projects.unshift(project);
    return project;
  },

  updateProject(id: string, body: Record<string, unknown>): Project | null {
    const project = this.getProject(id);
    if (!project) return null;

    const allowedFields = [
      'description',
      'category',
      'address',
      'zipCode',
      'city',
      'state',
      'clientName',
      'status',
    ];
    for (const key of allowedFields) {
      if (key in body) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (project as any)[key] = body[key];
      }
    }
    project.updatedAt = now();
    return project;
  },

  deleteProject(id: string): boolean {
    const project = this.getProject(id);
    if (!project) return false;
    project.deletedAt = now();
    return true;
  },

  duplicateProject(id: string): Project | null {
    const source = this.getProject(id);
    if (!source) return null;

    const store = getStore();
    const clone = structuredClone(source);
    clone.id = genId('project');
    clone.status = 'draft' as ProjectStatus;
    clone.description = `${source.description} (copy)`;
    clone.currentJobId = null;
    clone.createdAt = now();
    clone.updatedAt = now();
    clone.deletedAt = null;

    // Re-key sections and their items
    for (const section of clone.sections) {
      section.id = genId('section');
      section.projectId = clone.id;
      for (const item of section.items) {
        item.id = genId('item');
        item.sectionId = section.id;
      }
    }
    // Re-key options
    for (const option of clone.options) {
      option.id = genId('option');
      option.projectId = clone.id;
    }

    store.projects.unshift(clone);
    return clone;
  },

  recalculate(id: string): Project | null {
    const project = this.getProject(id);
    if (!project) return null;
    recalculateProject(project);
    project.updatedAt = now();
    return project;
  },

  // -- Generation -----------------------------------------------------------

  startGenerate(projectId: string): { jobId: string } | null {
    const project = this.getProject(projectId);
    if (!project) return null;

    const jobId = genId('job');
    project.status = 'generating';
    project.currentJobId = jobId;
    project.updatedAt = now();

    // Schedule "completion" — after the SSE stream finishes, the frontend
    // will reload the project. We populate sections/options so it has data.
    setTimeout(() => {
      if (project.status !== 'generating') return;
      const template = structuredClone(mockProjectWithSections);
      project.sections = template.sections.map((s) => ({
        ...s,
        id: genId('section'),
        projectId: project.id,
        items: s.items.map((item) => ({
          ...item,
          id: genId('item'),
          sectionId: s.id,
        })),
      }));
      // Fix sectionId references after new section IDs
      for (const s of project.sections) {
        for (const item of s.items) {
          item.sectionId = s.id;
        }
      }
      project.options = template.options.map((o) => ({
        ...o,
        id: genId('option'),
        projectId: project.id,
      }));
      project.status = 'review';
      project.total = template.total;
      project.currentJobId = null;
      project.updatedAt = now();
    }, 12_000);

    return { jobId };
  },

  // -- Sections -------------------------------------------------------------

  createSection(
    projectId: string,
    body: Record<string, unknown>,
  ): Section | null {
    const project = this.getProject(projectId);
    if (!project) return null;

    const section: Section = {
      id: genId('section'),
      projectId,
      name: (body.name as string) ?? 'New Section',
      sortOrder: project.sections.length + 1,
      subtotal: 0,
      items: [],
      createdAt: now(),
      updatedAt: now(),
    };
    project.sections.push(section);
    project.updatedAt = now();
    return section;
  },

  updateSection(
    sectionId: string,
    body: Record<string, unknown>,
  ): Section | null {
    const store = getStore();
    for (const project of store.projects) {
      const section = project.sections.find((s) => s.id === sectionId);
      if (section) {
        if ('name' in body) section.name = body.name as string;
        section.updatedAt = now();
        project.updatedAt = now();
        return section;
      }
    }
    return null;
  },

  deleteSection(sectionId: string): boolean {
    const store = getStore();
    for (const project of store.projects) {
      const idx = project.sections.findIndex((s) => s.id === sectionId);
      if (idx >= 0) {
        project.sections.splice(idx, 1);
        recalculateProject(project);
        project.updatedAt = now();
        return true;
      }
    }
    return false;
  },

  // -- Items ----------------------------------------------------------------

  createItem(body: Record<string, unknown>): Item | null {
    const store = getStore();
    const sectionId = body.sectionId as string;

    for (const project of store.projects) {
      const section = project.sections.find((s) => s.id === sectionId);
      if (section) {
        const quantity = (body.quantity as number) ?? 1;
        const unitCost = (body.unitCost as number) ?? 0;
        const item: Item = {
          id: genId('item'),
          sectionId,
          description: (body.description as string) ?? '',
          quantity,
          unit: (body.unit as string) ?? 'ea',
          unitCost,
          extendedCost: quantity * unitCost,
          source: 'manual',
          sourceData: {},
          sortOrder: section.items.length + 1,
          createdAt: now(),
          updatedAt: now(),
        };
        section.items.push(item);
        recalculateProject(project);
        project.updatedAt = now();
        return item;
      }
    }
    return null;
  },

  updateItem(itemId: string, body: Record<string, unknown>): Item | null {
    const store = getStore();
    for (const project of store.projects) {
      for (const section of project.sections) {
        const item = section.items.find((i) => i.id === itemId);
        if (item) {
          const allowedFields = ['description', 'quantity', 'unit', 'unitCost'];
          for (const key of allowedFields) {
            if (key in body) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (item as any)[key] = body[key];
            }
          }
          item.extendedCost = item.quantity * item.unitCost;
          item.updatedAt = now();
          recalculateProject(project);
          project.updatedAt = now();
          return item;
        }
      }
    }
    return null;
  },

  deleteItem(itemId: string): boolean {
    const store = getStore();
    for (const project of store.projects) {
      for (const section of project.sections) {
        const idx = section.items.findIndex((i) => i.id === itemId);
        if (idx >= 0) {
          section.items.splice(idx, 1);
          recalculateProject(project);
          project.updatedAt = now();
          return true;
        }
      }
    }
    return false;
  },

  reorderItems(sectionId: string, itemIds: string[]): Item[] | null {
    const store = getStore();
    for (const project of store.projects) {
      const section = project.sections.find((s) => s.id === sectionId);
      if (section) {
        const reordered: Item[] = [];
        for (let i = 0; i < itemIds.length; i++) {
          const item = section.items.find((it) => it.id === itemIds[i]);
          if (item) {
            item.sortOrder = i + 1;
            reordered.push(item);
          }
        }
        section.items = reordered;
        return reordered;
      }
    }
    return null;
  },

  // -- Options --------------------------------------------------------------

  updateOption(optionId: string, body: Record<string, unknown>): Option | null {
    const store = getStore();
    for (const project of store.projects) {
      const option = project.options.find((o) => o.id === optionId);
      if (option) {
        const allowedFields = [
          'label',
          'description',
          'total',
          'multiplier',
          'isRecommended',
        ];
        for (const key of allowedFields) {
          if (key in body) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (option as any)[key] = body[key];
          }
        }
        project.updatedAt = now();
        return option;
      }
    }
    return null;
  },

  // -- Admin ----------------------------------------------------------------

  reset(): void {
    globalThis.__mockDb = createStore();
  },
};
