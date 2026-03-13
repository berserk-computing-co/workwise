// Re-export shared types that are used directly without modification
export type {
  Organization,
  User,
  Section,
  Item,
  PipelineJob as PipelineJobEntity,
  PaginatedResponse,
  AuthSetupPayload,
  AuthSetupResponse,
  JobProgressEvent,
  CreateProjectPayload,
  UpdateProjectPayload,
  UpdateOrganizationPayload,
  CreateItemPayload,
  UpdateItemPayload,
  ReorderItemsPayload,
  ApiError,
  ValidationErrorDetail,
  ValidationErrorResponse,
  GenerateResponse,
  PaginationMeta,
} from '@workwise/shared-types';

// Re-export enums that are safe to import as values
export {
  JobStatus,
  StepStatus,
  TargetType,
  PipelineType,
  ItemCategory,
  ItemSource,
  OptionTier,
} from '@workwise/shared-types';

// Re-export the ProjectStatus enum under a different name for consumers that
// need enum values; the string union below preserves backward compat.
export { ProjectStatus as ProjectStatusEnum } from '@workwise/shared-types';

// Re-export GenerateResponse as PipelineJob for backward compatibility
export type { GenerateResponse as PipelineJob } from '@workwise/shared-types';

// ProjectStatus kept as a string union so consumers can use string literals
// and Record<ProjectStatus, string> with string keys (the enum would require
// enum member keys and includes a Cancelled member consumers don't handle).
export type ProjectStatus =
  | 'draft'
  | 'generating'
  | 'cancelled'
  | 'review'
  | 'sent'
  | 'accepted'
  | 'rejected';

// Option with frontend-only fields not present in the shared entity.
// multiplier is returned by the API but not in the shared model; tier is
// kept as a string union so Record<Option["tier"], string> works with
// string literal keys.
export interface Option {
  id: string;
  projectId: string;
  tier: 'good' | 'better' | 'best';
  label: string | null;
  description: string | null;
  total: number;
  multiplier: number;
  isRecommended: boolean;
  overrides: Record<string, unknown>;
  createdAt: string;
}

// Project re-declared locally so that options uses the local Option type
// (which includes multiplier) rather than the shared model's Option type.
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
  clientEmail: string | null;
  clientPhone: string | null;
  total: number;
  currentJobId: string | null;
  metadata: Record<string, unknown>;
  sections: import('@workwise/shared-types').Section[];
  options: Option[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ValidationError kept for backward compat — mirrors the shape used in
// api/client.ts (fields array from ValidationErrorDetail).
export interface ValidationError {
  message: { field: string; message: string }[];
}
