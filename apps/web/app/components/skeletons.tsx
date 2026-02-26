"use client";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-slate-700 ${className || ""}`}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function ProjectsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 space-y-3"
          >
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
