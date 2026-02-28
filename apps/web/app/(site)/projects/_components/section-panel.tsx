"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Item, Section } from "@/app/types/project-api";
import { formatCurrency } from "./constants";
import { EditableField } from "./editable-field";
import { EditableCell } from "./editable-cell";

interface SectionPanelProps {
  section: Section;
  projectId: string;
  onRefetch: () => Promise<void>;
  addToast: (type: "success" | "error" | "info", message: string) => void;
  onDeleteRequest: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
}

interface EditingCell {
  itemId: string;
  field: "description" | "quantity" | "unit" | "unitCost";
}

export function SectionPanel({
  section,
  projectId,
  onRefetch,
  addToast,
  onDeleteRequest,
  onAddItem,
}: SectionPanelProps) {
  const [open, setOpen] = useState(true);
  const [localItems, setLocalItems] = useState<Item[]>(section.items);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  // Keep localItems in sync when section prop changes
  useEffect(() => {
    setLocalItems(section.items);
  }, [section.items]);

  const handleSaveSectionName = async (newName: string) => {
    const res = await fetch(
      `/api/proxy/projects/${projectId}/sections/${section.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      addToast(
        "error",
        (err as { message?: string }).message ?? "Failed to save section name",
      );
      throw new Error("save failed");
    }
    addToast("success", "Section renamed");
    await onRefetch();
  };

  const handleSaveItemField = async (
    itemId: string,
    field: EditingCell["field"],
    rawValue: string,
  ) => {
    const numericFields = ["quantity", "unitCost"] as const;
    const isNumeric = (numericFields as readonly string[]).includes(field);
    const parsed = isNumeric ? parseFloat(rawValue) : rawValue;

    if (isNumeric && isNaN(parsed as number)) return;

    // Optimistic update
    setLocalItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: parsed };
        updated.extendedCost = updated.quantity * updated.unitCost;
        return updated;
      }),
    );

    const res = await fetch(
      `/api/proxy/projects/${projectId}/items/${itemId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: parsed }),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      addToast(
        "error",
        (err as { message?: string }).message ?? "Failed to save item",
      );
      // Revert optimistic update
      setLocalItems(section.items);
      throw new Error("save failed");
    }
    setEditingCell(null);
    await onRefetch();
  };

  const handleDeleteItem = async (itemId: string) => {
    // Optimistic remove
    setLocalItems((prev) => prev.filter((i) => i.id !== itemId));
    const res = await fetch(
      `/api/proxy/projects/${projectId}/items/${itemId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      addToast("error", "Failed to delete item");
      setLocalItems(section.items);
      return;
    }
    addToast("success", "Item deleted");
    await onRefetch();
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const items = [...localItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    setLocalItems(items);

    const res = await fetch(`/api/proxy/projects/${projectId}/items/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: section.id,
        itemIds: items.map((i) => i.id),
      }),
    });
    if (!res.ok) {
      addToast("error", "Failed to reorder items");
      setLocalItems(section.items);
    }
  };

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1e] transition-colors group cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div
          className="flex items-center gap-3 flex-1 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <EditableField
            value={section.name}
            onSave={handleSaveSectionName}
            className="min-w-0"
            renderDisplay={(v) => (
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {v}
              </span>
            )}
          />
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
            {localItems.length} {localItems.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatCurrency(section.subtotal)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(section.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 focus:opacity-100"
            aria-label="Delete section"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          {localItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
              No items in this section
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1e]/50">
                    <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                      Unit
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      Unit Cost
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      Ext. Cost
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                      Source
                    </th>
                    <th className="px-2 py-2.5 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {localItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-[#1a1a1e]/50 transition-colors group/row"
                    >
                      {/* Description */}
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100 min-w-[200px]">
                        <EditableCell
                          value={item.description}
                          type="text"
                          onSave={(v) =>
                            handleSaveItemField(item.id, "description", v)
                          }
                        />
                      </td>
                      {/* Qty */}
                      <td className="py-3 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300 w-20">
                        <EditableCell
                          value={item.quantity}
                          type="number"
                          onSave={(v) =>
                            handleSaveItemField(item.id, "quantity", v)
                          }
                          className="text-right"
                          step="any"
                        />
                      </td>
                      {/* Unit */}
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 w-20">
                        <EditableCell
                          value={item.unit}
                          type="text"
                          onSave={(v) =>
                            handleSaveItemField(item.id, "unit", v)
                          }
                        />
                      </td>
                      {/* Unit Cost */}
                      <td className="py-3 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300 w-28">
                        <EditableCell
                          value={item.unitCost}
                          type="number"
                          onSave={(v) =>
                            handleSaveItemField(item.id, "unitCost", v)
                          }
                          className="text-right"
                          step="0.01"
                        />
                      </td>
                      {/* Ext Cost (optimistic) */}
                      <td className="py-3 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300 w-28">
                        {formatCurrency(item.extendedCost)}
                      </td>
                      {/* Source */}
                      <td className="py-3 px-4">
                        {item.source ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            {item.source}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700">
                            —
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="py-3 px-2 w-20">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button
                            onClick={() => void handleReorder(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-20"
                            aria-label="Move up"
                          >
                            <ChevronUpIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleReorder(index, "down")}
                            disabled={index === localItems.length - 1}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-20"
                            aria-label="Move down"
                          >
                            <ChevronDownIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDeleteItem(item.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                            aria-label="Delete item"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Add item button */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => onAddItem(section.id)}
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none"
            >
              + Add Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
