"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, Modal, Spinner } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type {
  Project,
  Option,
  ProjectStatus,
  Section,
} from "@/app/types/project-api";
import { ProgressOverlay } from "@/app/components/progress-overlay";
import { useToast } from "@/app/components/toast";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  generating:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 animate-pulse",
  review: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  sent: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

function SectionPanel({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900 dark:text-slate-100">
            {section.name}
          </span>
          <span className="rounded-full bg-gray-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-400">
            {section.items.length}{" "}
            {section.items.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {formatCurrency(section.subtotal)}
          </span>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-slate-700">
          {section.items.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500 dark:text-slate-400">
              No items in this section
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40">
                    <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-slate-400">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-slate-400">
                      Unit
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      Unit Cost
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      Ext. Cost
                    </th>
                    <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-slate-400">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {section.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="px-5 py-3 text-gray-900 dark:text-slate-100">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-slate-300">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-slate-300">
                        {formatCurrency(item.unitCost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-slate-300">
                        {formatCurrency(item.extendedCost)}
                      </td>
                      <td className="px-5 py-3">
                        {item.source ? (
                          <span className="inline-flex rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                            {item.source}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OptionCard({
  option,
  recommended,
}: {
  option: Option;
  recommended: boolean;
}) {
  const tierLabels: Record<Option["tier"], string> = {
    good: "Good",
    better: "Better",
    best: "Best",
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border p-5 flex flex-col gap-2 ${
        recommended
          ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500"
          : "border-gray-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
          {tierLabels[option.tier]}
        </span>
        {recommended && (
          <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            Recommended
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
        {formatCurrency(option.total)}
      </p>
      <p className="text-sm text-gray-500 dark:text-slate-400">
        {option.multiplier}x multiplier
      </p>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/proxy/projects/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load project");
      const data: Project = await res.json();
      setProject(data);
      setNotFound(false);
    } catch {
      setNotFound(true);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProject().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const jobIdFromUrl = searchParams.get("generating");
    if (jobIdFromUrl) {
      setGeneratingJobId(jobIdFromUrl);
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/proxy/projects/${id}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to start generation");
      }
      const { jobId } = await res.json();
      setGeneratingJobId(jobId);
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Generation failed",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateComplete = async () => {
    setGeneratingJobId(null);
    await fetchProject();
    addToast("success", "Estimate generated");
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/proxy/projects/${id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to duplicate project");
      }
      const data = await res.json();
      addToast("success", "Project duplicated");
      router.push(`/projects/${data.id}`);
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Duplicate failed",
      );
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to delete project");
      }
      addToast("success", "Project deleted");
      router.push("/projects");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Delete failed");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold text-gray-900 dark:text-slate-100">
          Project not found
        </p>
        <Link
          href="/projects"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const sortedOptions = [...(project.options ?? [])].sort((a, b) => {
    const order = { good: 0, better: 1, best: 2 };
    return order[a.tier] - order[b.tier];
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/projects"
          className="inline-block mb-4 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
        >
          ← Projects
        </Link>

        {/* Header card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                {project.description}
              </h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">
                {project.address}, {project.zipCode}
              </p>
              {project.clientName && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
                  {project.clientName}
                </p>
              )}
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status]}`}
              >
                {project.status.charAt(0).toUpperCase() +
                  project.status.slice(1)}
              </span>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {formatCurrency(project.total)}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                Total estimate
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100 dark:border-slate-700">
            <Button
              color="blue"
              size="sm"
              disabled={project.status === "generating" || generating}
              onClick={handleGenerate}
              isProcessing={generating}
            >
              Generate Estimate
            </Button>
            <Button
              color="gray"
              size="sm"
              outline
              disabled={duplicating}
              isProcessing={duplicating}
              onClick={handleDuplicate}
            >
              Duplicate
            </Button>
            <Button
              color="failure"
              size="sm"
              outline
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-4 mb-8">
          {project.sections.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 px-5 py-10 text-center">
              <p className="text-gray-500 dark:text-slate-400 text-sm">
                No sections yet. Generate an estimate to get started.
              </p>
            </div>
          ) : (
            project.sections.map((section) => (
              <SectionPanel key={section.id} section={section} />
            ))
          )}
        </div>

        {/* Options panel */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Estimate Options
          </h2>
          {sortedOptions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 px-5 py-10 text-center">
              <p className="text-gray-500 dark:text-slate-400 text-sm">
                Generate an estimate to see pricing options
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  recommended={option.tier === "better"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SSE Progress overlay */}
      <ProgressOverlay
        jobId={generatingJobId}
        onComplete={handleGenerateComplete}
        onClose={() => setGeneratingJobId(null)}
      />

      {/* Delete confirmation modal */}
      <Modal
        show={showDeleteModal}
        size="md"
        onClose={() => setShowDeleteModal(false)}
      >
        <Modal.Header>Delete Project?</Modal.Header>
        <Modal.Body>
          <p className="text-gray-700 dark:text-slate-300 text-sm">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              color="gray"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              color="failure"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              isProcessing={deleting}
            >
              Delete
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
