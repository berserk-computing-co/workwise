"use client";

import type { Option } from "@/app/types/project-api";
import { formatCurrency } from "./constants";
import { EditableField } from "./editable-field";

interface OptionCardProps {
  option: Option;
  recommended: boolean;
  projectId: string;
  onRefetch: () => Promise<void>;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

const tierLabels: Record<Option["tier"], string> = {
  good: "Good",
  better: "Better",
  best: "Best",
};

export function OptionCard({
  option,
  recommended,
  projectId,
  onRefetch,
  addToast,
}: OptionCardProps) {
  const handleSaveMultiplier = async (newValue: string) => {
    const parsed = parseFloat(newValue);
    if (isNaN(parsed) || parsed <= 0) {
      addToast("error", "Multiplier must be a positive number");
      throw new Error("invalid");
    }
    const patchRes = await fetch(
      `/api/proxy/projects/${projectId}/options/${option.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ multiplier: parsed }),
      },
    );
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      addToast(
        "error",
        (err as { message?: string }).message ?? "Failed to update multiplier",
      );
      throw new Error("save failed");
    }
    // Recalculate totals
    await fetch(`/api/proxy/projects/${projectId}/recalculate`, {
      method: "POST",
    });
    addToast("success", "Multiplier updated");
    await onRefetch();
  };

  return (
    <div
      className={`bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-2 ${
        recommended ? "ring-2 ring-gray-900 dark:ring-white" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {tierLabels[option.tier]}
        </span>
        {recommended && (
          <span className="rounded-full bg-gray-900 dark:bg-white px-2 py-0.5 text-xs font-medium text-white dark:text-gray-900">
            Recommended
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-gray-100">
        {formatCurrency(option.total)}
      </p>
      <EditableField
        value={String(option.multiplier)}
        onSave={handleSaveMultiplier}
        renderDisplay={(v) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {v}x multiplier
          </span>
        )}
        inputClassName="w-24 text-sm"
      />
    </div>
  );
}
