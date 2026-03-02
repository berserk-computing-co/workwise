/**
 * Vite-aliased replacement for @/app/hooks/use-job-progress.
 * The real hook opens a native EventSource which can't be intercepted by MSW.
 * Stories control the displayed state by setting window.__mockJobProgress in
 * beforeEach; unset (or between stories) it defaults to the connecting state.
 */

export type StepStatus =
  | "pending"
  | "running"
  | "complete"
  | "completed"
  | "error";

export interface ProgressStep {
  step: string;
  status: StepStatus;
  message: string;
  total?: number;
}

export interface UseJobProgressReturn {
  steps: ProgressStep[];
  isComplete: boolean;
  error: string | null;
  connect: (jobId: string) => void;
  disconnect: () => void;
}

type MockState = {
  steps: ProgressStep[];
  isComplete: boolean;
  error: string | null;
};

declare global {
  interface Window {
    __mockJobProgress?: MockState;
  }
}

export function useJobProgress(): UseJobProgressReturn {
  const state: MockState = window.__mockJobProgress ?? {
    steps: [],
    isComplete: false,
    error: null,
  };
  return {
    ...state,
    connect: () => {},
    disconnect: () => {},
  };
}
