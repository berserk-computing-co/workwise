"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ProgressOverlay } from "@/app/components/progress-overlay";

type PageState = "idle" | "generating" | "done";

function IdleView({
  description,
  onDescriptionChange,
  zip,
  onZipChange,
  onSubmit,
  error,
  isLoggedIn,
  submitting,
}: {
  description: string;
  onDescriptionChange: (v: string) => void;
  zip: string;
  onZipChange: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
  isLoggedIn: boolean;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Generate an Estimate
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Describe your project and we&apos;ll generate an AI-powered estimate
          with real material and labor pricing.
        </p>
      </div>

      <div className="w-full">
        <textarea
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 resize-none dark:bg-[#0f0f12] dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
          style={{ minHeight: 140 }}
          placeholder="e.g. Build a 500 sq ft cedar deck in the backyard with stairs and railing..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>

      <div className="w-full">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 dark:bg-[#0f0f12] dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
          placeholder="ZIP code"
          aria-label="ZIP code"
          value={zip}
          onChange={(e) => onZipChange(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      {error && (
        <div className="w-full rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoggedIn ? (
        <button
          onClick={onSubmit}
          disabled={!description.trim() || zip.length !== 5 || submitting}
          className="w-full rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {submitting ? "Creating project..." : "Generate Estimate"}
        </button>
      ) : (
        <a
          href="/api/auth/login"
          className="w-full inline-flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Sign in to Generate
        </a>
      )}
    </div>
  );
}

export function BidGenerator() {
  const router = useRouter();
  const { user } = useUser();

  const [pageState, setPageState] = useState<PageState>("idle");
  const [description, setDescription] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  async function handleSubmit() {
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Create project on the NestJS backend
      const createRes = await fetch("/api/proxy/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          address: "",
          zipCode: zip,
        }),
      });

      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message || "Failed to create project",
        );
      }

      const project = await createRes.json();
      setProjectId(project.id);

      // 2. Trigger generation on the NestJS backend
      const genRes = await fetch(`/api/proxy/projects/${project.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        const body = await genRes.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ||
            "Failed to start generation",
        );
      }

      const { jobId } = await genRes.json();

      // 3. Show progress overlay — SSE handles the rest
      setGeneratingJobId(jobId);
      setPageState("generating");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleGenerateComplete() {
    setGeneratingJobId(null);
    if (projectId) {
      router.push(`/projects/${projectId}`);
    }
  }

  function handleProgressClose() {
    setGeneratingJobId(null);
    // If job was cancelled/errored, go back to idle with the project link
    if (projectId) {
      setPageState("idle");
      setError(
        "Generation was interrupted. You can try again from the project page.",
      );
    }
  }

  function handleReset() {
    setDescription("");
    setZip("");
    setError(null);
    setProjectId(null);
    setPageState("idle");
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
      <div className="bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800 rounded-2xl w-full max-w-2xl p-8">
        {(pageState === "idle" || pageState === "generating") && (
          <IdleView
            description={description}
            onDescriptionChange={setDescription}
            zip={zip}
            onZipChange={setZip}
            onSubmit={handleSubmit}
            error={error}
            isLoggedIn={!!user}
            submitting={submitting}
          />
        )}
      </div>

      <ProgressOverlay
        jobId={generatingJobId}
        onComplete={handleGenerateComplete}
        onClose={handleProgressClose}
      />
    </div>
  );
}
