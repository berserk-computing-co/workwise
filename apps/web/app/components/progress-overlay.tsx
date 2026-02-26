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

// Pipeline phases — parallel steps grouped into one phase
const PHASES: { steps: string[]; label: string; description: string }[] = [
  {
    steps: ["scope_decomposition"],
    label: "Analyzing project scope",
    description: "Breaking down the project into sections and line items",
  },
  {
    steps: ["price_resolution", "web_price_resolution"],
    label: "Resolving prices",
    description: "Searching database and web for material and labor costs",
  },
  {
    steps: ["price_merge"],
    label: "Merging price data",
    description: "Combining sources for best accuracy",
  },
  {
    steps: ["option_generation"],
    label: "Generating options",
    description: "Creating good / better / best pricing tiers",
  },
  {
    steps: ["calculation"],
    label: "Calculating totals",
    description: "Computing final totals and saving your estimate",
  },
];

type PhaseStatus = "pending" | "running" | "completed" | "error";

function getPhaseStatus(
  phase: { steps: string[] },
  stepMap: Map<string, ProgressStep>,
): PhaseStatus {
  const statuses = phase.steps.map(
    (s) => stepMap.get(s)?.status ?? "pending",
  );
  if (statuses.some((s) => s === "error")) return "error";
  if (statuses.every((s) => s === "completed")) return "completed";
  if (statuses.some((s) => s === "running" || s === "completed"))
    return "running";
  return "pending";
}

function getPhaseMessage(
  phase: { steps: string[] },
  stepMap: Map<string, ProgressStep>,
): string | null {
  for (const s of phase.steps) {
    const step = stepMap.get(s);
    if (step?.status === "error" && step.message) return step.message;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="h-5 w-5 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white animate-spin flex-shrink-0" />
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

function PhaseRow({
  label,
  description,
  status,
  errorMessage,
}: {
  label: string;
  description: string;
  status: PhaseStatus;
  errorMessage: string | null;
}) {
  return (
    <div className="flex items-start gap-3.5 py-3.5 animate-[stepIn_0.35s_ease-out_both]">
      <div className="mt-0.5">
        {status === "completed" ? (
          <CompletedCheck />
        ) : status === "error" ? (
          <ErrorDot />
        ) : status === "running" ? (
          <Spinner />
        ) : null}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className={
            status === "error"
              ? "text-sm font-medium text-red-500 dark:text-red-400"
              : status === "running"
                ? "text-sm font-medium text-gray-900 dark:text-gray-100"
                : "text-sm text-gray-500 dark:text-gray-500"
          }
        >
          {label}
        </span>
        {status === "running" && (
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {description}
          </span>
        )}
        {status === "error" && errorMessage && (
          <span className="text-xs text-red-400 dark:text-red-500 mt-0.5">
            {errorMessage}
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

  // Build step lookup
  const stepMap = new Map(steps.map((s) => [s.step, s]));

  // Compute phase statuses
  const phaseStatuses = PHASES.map((phase) => ({
    ...phase,
    status: getPhaseStatus(phase, stepMap),
    errorMessage: getPhaseMessage(phase, stepMap),
  }));

  // Only show completed + running + error phases (progressive reveal)
  const visiblePhases = phaseStatuses.filter(
    (p) => p.status !== "pending",
  );

  const completedPhases = phaseStatuses.filter(
    (p) => p.status === "completed",
  ).length;
  const currentPhase =
    completedPhases +
    (phaseStatuses.some((p) => p.status === "running") ? 1 : 0);
  const progress = isComplete
    ? 100
    : (completedPhases / PHASES.length) * 100;

  // Better error message for connection drops
  const displayError =
    error === "Connection lost. Please try again."
      ? "Lost connection to the server. The generation may still be running — check the project page."
      : error;

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

                {/* Phase counter */}
                {currentPhase > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Step {currentPhase} of {PHASES.length}
                  </p>
                )}
                {currentPhase === 0 && <div className="mb-4" />}

                {/* Error banner */}
                {displayError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-4">
                    {displayError}
                  </div>
                )}

                {/* Phases list */}
                <div className="min-h-[100px]">
                  {visiblePhases.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {visiblePhases.map((phase, i) => (
                        <PhaseRow
                          key={i}
                          label={phase.label}
                          description={phase.description}
                          status={phase.status}
                          errorMessage={phase.errorMessage}
                        />
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
