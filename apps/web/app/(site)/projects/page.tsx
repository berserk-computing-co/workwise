"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import {
  Project,
  ProjectStatus,
  PaginatedResponse,
} from "@/app/types/project-api";
import { ProjectsListSkeleton } from "@/app/components/skeletons";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  generating:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 animate-pulse",
  review: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  sent: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const STATUS_TABS: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Generating", value: "generating" },
  { label: "Review", value: "review" },
  { label: "Sent", value: "sent" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function ProjectsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedResponse<Project> | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter !== "all") {
      params.set("status", filter);
    }
    fetch(`/api/proxy/projects?${params.toString()}`)
      .then((res) => res.json())
      .then((json: PaginatedResponse<Project>) => {
        setData(json);
      })
      .finally(() => setLoading(false));
  }, [filter, page]);

  const handleTabClick = (value: ProjectStatus | "all") => {
    setFilter(value);
    setPage(1);
  };

  const projects = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.pages ?? 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Projects
          </h1>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            New Project
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <ProjectsListSkeleton />
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <DocumentPlusIcon className="h-16 w-16 text-gray-300 dark:text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              No projects yet
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Create your first project to get started
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              New Project
            </Link>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <p className="font-medium text-gray-900 dark:text-slate-100 line-clamp-2 mb-1">
                    {project.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 truncate mb-3">
                    {project.address}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status]}`}
                    >
                      {project.status.charAt(0).toUpperCase() +
                        project.status.slice(1)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {formatCurrency(project.total)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {formatDate(project.createdAt)}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
