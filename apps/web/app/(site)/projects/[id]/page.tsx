"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Modal } from "flowbite-react";
import { ProjectDetailSkeleton } from "@/app/components/skeletons";
import type { Project } from "@/app/types/project-api";
import { ProgressOverlay } from "@/app/components/progress-overlay";
import { useToast } from "@/app/components/toast";
import { STATUS_STYLES, formatCurrency } from "../_components/constants";
import { EditableField } from "../_components/editable-field";
import { SectionPanel } from "../_components/section-panel";
import { OptionCard } from "../_components/option-card";
import { AddItemModal } from "../_components/add-item-modal";
import { AddSectionModal } from "../_components/add-section-modal";

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

  // Edit/add state
  const [addItemSectionId, setAddItemSectionId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);

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
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore overlay from URL param or from project's active job
  useEffect(() => {
    const jobIdFromUrl = searchParams.get("generating");
    if (jobIdFromUrl) {
      setGeneratingJobId(jobIdFromUrl);
    } else if (
      project?.status === "generating" &&
      project.currentJobId &&
      !generatingJobId
    ) {
      setGeneratingJobId(project.currentJobId);
    }
  }, [searchParams, project]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveDescription = async (newValue: string) => {
    const res = await fetch(`/api/proxy/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newValue }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      addToast(
        "error",
        (err as { message?: string }).message ?? "Failed to save description",
      );
      throw new Error("save failed");
    }
    addToast("success", "Description updated");
    await fetchProject();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/proxy/projects/${id}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? "Failed to start generation",
        );
      }
      const { jobId } = await res.json();
      setGeneratingJobId(jobId);
      setProject((prev) =>
        prev ? { ...prev, status: "generating" as const, currentJobId: jobId } : prev,
      );
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
        throw new Error(
          (err as { message?: string }).message ??
            "Failed to duplicate project",
        );
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
        throw new Error(
          (err as { message?: string }).message ?? "Failed to delete project",
        );
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

  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;
    setDeletingSection(true);
    try {
      const res = await fetch(
        `/api/proxy/projects/${id}/sections/${deleteSectionId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? "Failed to delete section",
        );
      }
      addToast("success", "Section deleted");
      setDeleteSectionId(null);
      await fetchProject();
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Delete section failed",
      );
    } finally {
      setDeletingSection(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <ProjectDetailSkeleton />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Project not found
        </p>
        <Link
          href="/projects"
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-block mb-6 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        ← Projects
      </Link>

      {/* Header */}
      <div className="bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <EditableField
              value={project.description}
              onSave={handleSaveDescription}
              multiline
              className="mb-1"
              renderDisplay={(v) => (
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {v}
                </h1>
              )}
            />
            <p className="text-sm text-gray-500 mb-1">
              {project.address}, {project.zipCode}
            </p>
            {project.clientName && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                {project.clientName}
              </p>
            )}
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status]}`}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {formatCurrency(project.total)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Total estimate
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
          {project.status === "generating" && project.currentJobId ? (
            <button
              onClick={() => setGeneratingJobId(project.currentJobId)}
              className="rounded-full bg-amber-500 dark:bg-amber-400 text-white dark:text-gray-900 px-5 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity animate-pulse"
            >
              View Progress
            </button>
          ) : (
            <button
              disabled={project.status === "generating" || generating}
              onClick={() => void handleGenerate()}
              className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {generating ? "Generating…" : "Generate Estimate"}
            </button>
          )}
          <button
            disabled={duplicating}
            onClick={() => void handleDuplicate()}
            className="rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            {duplicating ? "Duplicating…" : "Duplicate"}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-full border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 px-5 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3 mb-4">
        {project.sections.length === 0 ? (
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl px-5 py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No sections yet. Generate an estimate to get started.
            </p>
          </div>
        ) : (
          project.sections.map((section) => (
            <SectionPanel
              key={section.id}
              section={section}
              projectId={id}
              onRefetch={fetchProject}
              addToast={addToast}
              onDeleteRequest={(sectionId) => setDeleteSectionId(sectionId)}
              onAddItem={(sectionId) => setAddItemSectionId(sectionId)}
            />
          ))
        )}
      </div>

      {/* Add Section */}
      <div className="mb-8">
        <button
          onClick={() => setShowAddSection(true)}
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none"
        >
          + Add Section
        </button>
      </div>

      {/* Options panel */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Estimate Options
        </h2>
        {sortedOptions.length === 0 ? (
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl px-5 py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                projectId={id}
                onRefetch={fetchProject}
                addToast={addToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* SSE Progress overlay */}
      <ProgressOverlay
        jobId={generatingJobId}
        projectId={id}
        onComplete={() => void handleGenerateComplete()}
        onClose={() => setGeneratingJobId(null)}
      />

      {/* Delete project modal */}
      <Modal
        show={showDeleteModal}
        size="md"
        onClose={() => setShowDeleteModal(false)}
      >
        <Modal.Header>Delete Project?</Modal.Header>
        <Modal.Body>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Delete section confirmation modal */}
      <Modal
        show={!!deleteSectionId}
        size="md"
        onClose={() => setDeleteSectionId(null)}
      >
        <Modal.Header>Delete Section?</Modal.Header>
        <Modal.Body>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Items will be moved to the &ldquo;Other&rdquo; section. This action
            cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteSectionId(null)}
              disabled={deletingSection}
              className="rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteSection()}
              disabled={deletingSection}
              className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {deletingSection ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Add item modal */}
      {addItemSectionId && (
        <AddItemModal
          projectId={id}
          sectionId={addItemSectionId}
          onClose={() => setAddItemSectionId(null)}
          onSuccess={() => {
            setAddItemSectionId(null);
            void fetchProject();
          }}
          addToast={addToast}
        />
      )}

      {/* Add section modal */}
      {showAddSection && (
        <AddSectionModal
          projectId={id}
          onClose={() => setShowAddSection(false)}
          onSuccess={() => {
            setShowAddSection(false);
            void fetchProject();
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
