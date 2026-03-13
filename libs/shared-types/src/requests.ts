import type { User, Organization } from './models.js';

// -- Auth --

export interface AuthSetupPayload {
  user: { firstName: string; lastName: string; email: string };
  organization: { name: string; zipCode: string };
}

export interface AuthSetupResponse {
  user: User;
  organization: Organization;
}

// -- Users --

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  licenseNumber?: string;
  emailDomain?: string;
  emailFromAddress?: string;
}

// -- Projects --

export interface CreateProjectPayload {
  description: string;
  address?: string;
  zipCode: string;
  city?: string;
  state?: string;
  category?: string;
  clientName?: string;
}

export interface UpdateProjectPayload {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  address?: string;
  status?: string;
  description?: string;
  category?: string;
}

// -- Sections --

export interface CreateSectionPayload {
  name: string;
}

export interface UpdateSectionPayload {
  name?: string;
  sortOrder?: number;
}

// -- Items --

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
}

export interface ReorderItemsPayload {
  sectionId: string;
  itemIds: string[];
}

// -- Options --

export interface UpdateOptionPayload {
  label?: string;
  description?: string;
  total?: number;
  isRecommended?: boolean;
}

// -- Pipeline --

export interface GenerateResponse {
  jobId: string;
}

export interface CancelResponse {
  cancelled: boolean;
}
