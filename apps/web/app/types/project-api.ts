// User & Organization
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  auth0Id: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  zipCode: string;
  createdAt: string;
  updatedAt: string;
}

// Project (the core entity)
export type ProjectStatus =
  | "draft"
  | "generating"
  | "cancelled"
  | "review"
  | "sent"
  | "accepted"
  | "rejected";

export interface Project {
  id: string;
  description: string;
  address: string;
  zipCode: string;
  category: string | null;
  clientName: string | null;
  status: ProjectStatus;
  total: number;
  currentJobId: string | null;
  organizationId: string;
  sections: Section[];
  options: Option[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Section {
  id: string;
  name: string;
  projectId: string;
  subtotal: number;
  items: Item[];
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  extendedCost: number;
  source: string | null;
  sectionId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Option {
  id: string;
  tier: "good" | "better" | "best";
  total: number;
  multiplier: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Auth setup
export interface AuthSetupPayload {
  user: { firstName: string; lastName: string; email: string };
  organization: { name: string; zipCode: string };
}

export interface AuthSetupResponse {
  user: User;
  organization: Organization;
}

// Pipeline / Jobs
export interface PipelineJob {
  jobId: string;
}

export interface JobProgressEvent {
  step: string;
  status: "pending" | "running" | "completed" | "error";
  message: string;
  total?: number;
}

// Request DTOs
export interface CreateProjectPayload {
  description: string;
  address: string;
  zipCode: string;
  category?: string;
  clientName?: string;
}

export interface UpdateProjectPayload {
  description?: string;
  address?: string;
  zipCode?: string;
  category?: string;
  clientName?: string;
  status?: ProjectStatus;
}

export interface CreateItemPayload {
  sectionId: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface UpdateItemPayload {
  description?: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  sectionId?: string;
}

export interface ReorderItemsPayload {
  sectionId: string;
  itemIds: string[];
}

// Error shapes
export interface ValidationError {
  message: { field: string; message: string }[];
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
