"use client";

import React, { useEffect, useRef } from "react";
import { Button, Modal, Spinner } from "flowbite-react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
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

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "completed") {
    return (
      <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
    );
  }
  if (status === "error") {
    return (
      <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" />
    );
  }
  if (status === "running") {
    return <Spinner size="sm" color="info" />;
  }
  return (
    <span className="inline-block h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-slate-600" />
  );
}

function StepRow({ step }: { step: ProgressStep }) {
  const label = STEP_LABELS[step.step] ?? step.step;
  const isRunning = step.status === "running";
  const isError = step.status === "error";

  return (
    <li className="flex items-start gap-3 py-2">
      <div className="mt-0.5">
        <StepIcon status={step.status} />
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={
            isError
              ? "text-sm font-medium text-red-600 dark:text-red-400"
              : isRunning
                ? "text-sm font-medium text-blue-600 dark:text-blue-400"
                : step.status === "completed"
                  ? "text-sm font-medium text-gray-900 dark:text-slate-100"
                  : "text-sm font-medium text-gray-400 dark:text-slate-500"
          }
        >
          {label}
        </span>
        {step.message && (
          <span className="text-xs text-gray-500 dark:text-slate-400 truncate">
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

  return (
    <Modal dismissible={false} show={isOpen} size="md" onClose={onClose}>
      <Modal.Header>Generating Estimate</Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-4">
          {isComplete ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircleIcon className="h-12 w-12 text-green-500 dark:text-green-400" />
              <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                Estimate generated successfully!
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {steps.length > 0 && (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {steps.map((step) => (
                <StepRow key={step.step} step={step} />
              ))}
            </ul>
          )}

          {!isComplete && steps.length === 0 && !error && (
            <div className="flex items-center gap-3 py-4">
              <Spinner size="md" color="info" />
              <span className="text-sm text-gray-600 dark:text-slate-400">
                Starting pipeline...
              </span>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end gap-2">
          {error && (
            <Button color="blue" onClick={onClose}>
              Close
            </Button>
          )}
          {!isComplete && (
            <Button color="gray" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
