import type {
  ProjectStatus,
  JobStatus,
  TargetType,
  PipelineType,
  OptionTier,
} from "./enums.js";

export interface Organization {
  id: string;
  name: string;
  zipCode: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  authId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  createdBy: string;
  status: ProjectStatus;
  description: string;
  category: string;
  address: string;
  zipCode: string;
  city: string | null;
  state: string | null;
  clientName: string | null;
  total: number;
  currentJobId: string | null;
  metadata: Record<string, unknown>;
  sections: Section[];
  options: Option[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  subtotal: number;
  items: Item[];
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  sectionId: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  extendedCost: number;
  sortOrder: number;
  source: string;
  sourceData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Option {
  id: string;
  projectId: string;
  tier: OptionTier;
  label: string | null;
  description: string | null;
  total: number;
  isRecommended: boolean;
  overrides: Record<string, unknown>;
  createdAt: string;
}

export interface PipelineJob {
  id: string;
  targetId: string;
  targetType: TargetType;
  pipelineType: PipelineType;
  triggeredBy: string;
  status: JobStatus;
  currentStep: string | null;
  steps: Record<string, unknown>[];
  errors: Record<string, unknown> | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostCents: number;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
