import type { StepStatus } from "./enums.js";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  statusCode: number;
  error: string;
  message: ValidationErrorDetail[];
}

export interface JobProgressEvent {
  step: string;
  status: StepStatus;
  message: string;
  total?: number;
}
