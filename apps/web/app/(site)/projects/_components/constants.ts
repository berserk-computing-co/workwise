import type { ProjectStatus } from "@/app/types/project-api";

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  generating:
    "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 animate-pulse",
  cancelled:
    "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  review: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  sent: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  accepted:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
