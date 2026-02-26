"use client";

import React, { useEffect, useRef } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useJobProgress } from "../hooks/use-job-progress";
import type { ProgressStep, StepStatus } from "../hooks/use-job-progress";

interface ProgressOverlayProps {
  jobId: string | null;
  onComplete: () => void;
  onClose: () => void;
}

const STEP_LABELS: Record<string, string> = {
  scope_decomposition: "Analyzing project scope",
  price_resolution: "Looking up material prices",
  web_price_resolution: "Searching web for prices",
  price_merge: "Merging price data",
  option_generation: "Generating estimate options",
  calculation: "Calculating totals",
};

function StepDot({ status }: { status: StepStatus }) {
  if (status === "completed") {
    return <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />;
  }
  if (status === "error") {
    return <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;
  }
  if (status === "running") {
    return (
      <span className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white animate-pulse flex-shrink-0" />
    );
  }
  return (
    <span className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
  );
}

function StepRow({ step }: { step: ProgressStep }) {
  const label = STEP_LABELS[step.step] ?? step.step;
  const isRunning = step.status === "running";
  const isError = step.status === "error";

  return (
    <li className="flex items-start gap-3 py-2">
      <div className="mt-1.5">
        <StepDot status={step.status} />
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={
            isError
              ? "text-sm text-red-500 dark:text-red-400"
              : isRunning
                ? "text-sm font-medium text-gray-900 dark:text-gray-100"
                : step.status === "completed"
                  ? "text-sm text-gray-600 dark:text-gray-400"
                  : "text-sm text-gray-600 dark:text-gray-400"
          }
        >
          {label}
        </span>
        {step.message && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {step.message}
          </span>
        )}
      </div>
    </li>
  );
}

export function ProgressOverlay({
  jobId,
  onComplete,
  onClose,
}: ProgressOverlayProps) {
  const { steps, isComplete, error, connect, disconnect } = useJobProgress();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (jobId) {
      connect(jobId);
    } else {
      disconnect();
    }
  }, [jobId, connect, disconnect]);

  useEffect(() => {
    if (!isComplete) return;
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isComplete]);

  const isOpen = jobId !== null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-[#1a1a1e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Generating Estimate
        </h2>

        <div className="flex flex-col gap-4">
          {isComplete ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                Estimate generated successfully!
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {steps.length > 0 && (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {steps.map((step) => (
                <StepRow key={step.step} step={step} />
              ))}
            </ul>
          )}

          {!isComplete && steps.length === 0 && !error && (
            <div className="flex items-center gap-3 py-4">
              <span className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white animate-pulse flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Starting pipeline...
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          {error && (
            <button
              onClick={onClose}
              className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Close
            </button>
          )}
          {!isComplete && (
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
