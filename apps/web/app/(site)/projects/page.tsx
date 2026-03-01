"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";
import {
  Project,
  ProjectStatus,
  PaginatedResponse,
} from "@/app/types/project-api";
import { ProjectsListSkeleton } from "@/app/components/skeletons";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  generating:
    "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 animate-pulse",
  review: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  sent: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  accepted:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
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
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          My projects & estimates
        </h1>
        <Link
          href="/projects/new"
          className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          + New Estimate
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 rounded-full bg-gray-100 dark:bg-gray-800/50 p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${filter === tab.value
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
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
        <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
            <SparklesIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Generate your first estimate
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Describe a job and our AI will build a detailed estimate with real
            material and labor pricing — in minutes.
          </p>
          <Link
            href="/projects/new"
            className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-7 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            Start an Estimate →
          </Link>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Link
              href="/projects/new"
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex flex-col items-center justify-center gap-2 text-center min-h-[140px]"
            >
              <PlusCircleIcon className="h-7 w-7 text-gray-400" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                New Estimate
              </span>
            </Link>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800 rounded-xl p-5 hover:border-gray-200 dark:hover:border-gray-700 transition-colors cursor-pointer"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                  {project.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-3">
                  {project.address}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[project.status]}`}
                  >
                    {project.status.charAt(0).toUpperCase() +
                      project.status.slice(1)}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(project.total)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
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
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${page === pageNum
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    {pageNum}
                  </button>
                ),
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
