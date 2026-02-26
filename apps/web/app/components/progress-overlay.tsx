"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useJobProgress } from "../hooks/use-job-progress";
import type { ProgressStep } from "../hooks/use-job-progress";

interface ProgressOverlayProps {
  jobId: string | null;
  onComplete: () => void;
  onClose: () => void;
}

const STEP_CONFIG: Record<string, { label: string; description: string }> = {
  scope_decomposition: {
    label: "Analyzing project scope",
    description: "Breaking down the project into sections and line items",
  },
  price_resolution: {
    label: "Looking up material prices",
    description: "Fetching material and labor costs from our database",
  },
  web_price_resolution: {
    label: "Searching web for prices",
    description: "Sourcing current pricing data from the web",
  },
  price_merge: {
    label: "Merging price data",
    description: "Combining sources for best accuracy",
  },
  option_generation: {
    label: "Generating options",
    description: "Creating good / better / best pricing tiers",
  },
  calculation: {
    label: "Calculating totals",
    description: "Computing final totals and saving your estimate",
  },
};

const TOTAL_STEPS = Object.keys(STEP_CONFIG).length;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const px = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div
      className={`${px} rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white animate-spin flex-shrink-0`}
    />
  );
}

function CompletedCheck() {
  return (
    <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 animate-[checkPop_0.3s_ease-out]">
      <CheckIcon className="h-3 w-3 text-white" />
    </div>
  );
}

function ErrorDot() {
  return (
    <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-bold">!</span>
    </div>
  );
}

function StepRow({ step }: { step: ProgressStep }) {
  const config = STEP_CONFIG[step.step];
  const label = config?.label ?? step.step;
  const description = config?.description;
  const isRunning = step.status === "running";
  const isCompleted = step.status === "completed";
  const isError = step.status === "error";

  return (
    <div className="flex items-start gap-3.5 py-3.5 animate-[stepIn_0.35s_ease-out_both]">
      <div className="mt-0.5">
        {isCompleted ? (
          <CompletedCheck />
        ) : isError ? (
          <ErrorDot />
        ) : isRunning ? (
          <Spinner />
        ) : null}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className={
            isError
              ? "text-sm font-medium text-red-500 dark:text-red-400"
              : isRunning
                ? "text-sm font-medium text-gray-900 dark:text-gray-100"
                : "text-sm text-gray-500 dark:text-gray-500"
          }
        >
          {label}
        </span>
        {isRunning && description && (
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {description}
          </span>
        )}
        {isError && step.message && (
          <span className="text-xs text-red-400 dark:text-red-500 mt-0.5">
            {step.message}
          </span>
        )}
      </div>
    </div>
  );
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ---------------------------------------------------------------------------
// Main overlay
// ---------------------------------------------------------------------------

export function ProgressOverlay({
  jobId,
  onComplete,
  onClose,
}: ProgressOverlayProps) {
  const { steps, isComplete, error, connect, disconnect } = useJobProgress();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [elapsed, setElapsed] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Elapsed timer
  useEffect(() => {
    if (!jobId || isComplete || error) return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [jobId, isComplete, error]);

  // SSE connection
  useEffect(() => {
    if (jobId) {
      connect(jobId);
    } else {
      disconnect();
    }
  }, [jobId, connect, disconnect]);

  // Auto-redirect on complete
  useEffect(() => {
    if (!isComplete) return;
    setShowSuccess(true);
    const timer = setTimeout(() => onCompleteRef.current(), 2000);
    return () => clearTimeout(timer);
  }, [isComplete]);

  const isOpen = jobId !== null;
  if (!isOpen) return null;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progress = isComplete ? 100 : (completedCount / TOTAL_STEPS) * 100;

  // Progressive reveal — only show completed + running + error steps
  const visibleSteps = steps.filter(
    (s) =>
      s.status === "completed" || s.status === "running" || s.status === "error",
  );

  const runningStep = steps.find((s) => s.status === "running");
  const stepNumber = completedCount + (runningStep ? 1 : 0);

  return (
    <>
      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkPop {
          0% { transform: scale(0); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes successIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white dark:bg-[#1a1a1e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl max-w-md w-full mx-4 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-gray-900 dark:bg-white transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-6">
            {showSuccess ? (
              /* -------- Success state -------- */
              <div className="flex flex-col items-center gap-4 py-8">
                <div
                  className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center"
                  style={{ animation: "successIn 0.4s ease-out" }}
                >
                  <CheckIcon className="h-7 w-7 text-white" />
                </div>
                <div
                  className="text-center"
                  style={{ animation: "fadeUp 0.4s ease-out 0.15s both" }}
                >
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Estimate ready!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Redirecting to your project...
                  </p>
                </div>
              </div>
            ) : (
              /* -------- Active / Error state -------- */
              <>
                {/* Header row */}
                <div className="flex items-baseline justify-between mb-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Generating Estimate
                  </h2>
                  <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                    {formatElapsed(elapsed)}
                  </span>
                </div>

                {/* Step counter */}
                {stepNumber > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Step {stepNumber} of {TOTAL_STEPS}
                  </p>
                )}
                {stepNumber === 0 && <div className="mb-4" />}

                {/* Error banner */}
                {error && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-4">
                    {error}
                  </div>
                )}

                {/* Steps list */}
                <div className="min-h-[100px]">
                  {visibleSteps.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {visibleSteps.map((step) => (
                        <StepRow key={step.step} step={step} />
                      ))}
                    </div>
                  ) : !error ? (
                    <div className="flex items-center gap-3 py-4">
                      <Spinner />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Starting pipeline...
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-end">
                  {error ? (
                    <button
                      onClick={onClose}
                      className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
