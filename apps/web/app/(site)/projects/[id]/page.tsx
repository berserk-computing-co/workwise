"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Modal, Spinner, TextInput, Label } from "flowbite-react";
import { ProjectDetailSkeleton } from "@/app/components/skeletons";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type {
  Item,
  Option,
  Project,
  ProjectStatus,
  Section,
} from "@/app/types/project-api";
import { ProgressOverlay } from "@/app/components/progress-overlay";
import { useToast } from "@/app/components/toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// EditableField — reusable inline text/textarea editor
// ---------------------------------------------------------------------------

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  renderDisplay: (value: string) => React.ReactNode;
}

function EditableField({
  value,
  onSave,
  className,
  inputClassName,
  multiline,
  renderDisplay,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const commit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      cancel();
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      // parent handles error toast; revert
      cancel();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === "Escape") {
      cancel();
      return;
    }
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      void commit();
    }
  };

  if (editing) {
    const sharedProps = {
      ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      value: draft,
      disabled: saving,
      onBlur: () => void commit(),
      onKeyDown: handleKeyDown,
      className: [
        "w-full rounded border border-blue-400 bg-white dark:bg-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400",
        inputClassName,
      ]
        .filter(Boolean)
        .join(" "),
    };

    return multiline ? (
      <textarea
        {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
      />
    ) : (
      <input
        {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)}
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        onChange={(e) => setDraft(e.target.value)}
      />
    );
  }

  return (
    <div className={`group flex items-center gap-1.5 ${className ?? ""}`}>
      {renderDisplay(value)}
      <button
        onClick={startEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
        aria-label="Edit"
      >
        <PencilIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditableCell — inline editor for a single table cell
// ---------------------------------------------------------------------------

interface EditableCellProps {
  value: string | number;
  type?: "text" | "number";
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  step?: string;
}

function EditableCell({
  value,
  type = "text",
  onSave,
  className,
  step,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(String(value));
  };

  const commit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === String(value)) {
      cancel();
      return;
    }
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      cancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      cancel();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={handleKeyDown}
        className={[
          "w-full rounded border border-blue-400 bg-white dark:bg-slate-700 px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className={[
        "w-full text-left rounded px-1 py-0.5 -mx-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-text",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {typeof value === "number" && type === "number" ? value : String(value)}
    </button>
  );
}

// ---------------------------------------------------------------------------
// AddItemModal
// ---------------------------------------------------------------------------

interface AddItemFormValues {
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
}

interface AddItemModalProps {
  projectId: string;
  sectionId: string;
  onClose: () => void;
  onSuccess: () => void;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

function AddItemModal({
  projectId,
  sectionId,
  onClose,
  onSuccess,
  addToast,
}: AddItemModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddItemFormValues>({
    defaultValues: { quantity: "1" },
  });

  const onSubmit = async (data: AddItemFormValues) => {
    try {
      const res = await fetch(`/api/proxy/projects/${projectId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          description: data.description.trim(),
          quantity: parseFloat(data.quantity),
          unit: data.unit.trim(),
          unitCost: parseFloat(data.unitCost),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? "Failed to add item",
        );
      }
      addToast("success", "Item added");
      onSuccess();
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to add item",
      );
    }
  };

  return (
    <Modal show onClose={onClose} size="md">
      <Modal.Header>Add Item</Modal.Header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="item-description" value="Description" />
              <TextInput
                id="item-description"
                {...register("description", { required: "Required" })}
                color={errors.description ? "failure" : undefined}
                helperText={errors.description?.message}
                placeholder="e.g. Install 1/2-in drywall"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="item-qty" value="Quantity" />
                <TextInput
                  id="item-qty"
                  type="number"
                  {...register("quantity", {
                    required: "Required",
                    min: { value: 0.001, message: "Must be > 0" },
                  })}
                  color={errors.quantity ? "failure" : undefined}
                  helperText={errors.quantity?.message}
                  step="any"
                />
              </div>
              <div>
                <Label htmlFor="item-unit" value="Unit" />
                <TextInput
                  id="item-unit"
                  {...register("unit", { required: "Required" })}
                  color={errors.unit ? "failure" : undefined}
                  helperText={errors.unit?.message}
                  placeholder="SF, LF, EA..."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="item-cost" value="Unit Cost ($)" />
              <TextInput
                id="item-cost"
                type="number"
                step="0.01"
                {...register("unitCost", {
                  required: "Required",
                  min: { value: 0, message: "Must be ≥ 0" },
                })}
                color={errors.unitCost ? "failure" : undefined}
                helperText={errors.unitCost?.message}
                placeholder="0.00"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              color="gray"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="blue"
              size="sm"
              type="submit"
              disabled={isSubmitting}
              isProcessing={isSubmitting}
            >
              Add Item
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// AddSectionModal
// ---------------------------------------------------------------------------

interface AddSectionModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

function AddSectionModal({
  projectId,
  onClose,
  onSuccess,
  addToast,
}: AddSectionModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/projects/${projectId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? "Failed to add section",
        );
      }
      addToast("success", "Section added");
      onSuccess();
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to add section",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onClose={onClose} size="sm">
      <Modal.Header>Add Section</Modal.Header>
      <Modal.Body>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSave();
            if (e.key === "Escape") onClose();
          }}
          placeholder="Section name"
          className="w-full rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 bg-transparent placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        />
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end gap-2">
          <Button color="gray" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            color="blue"
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving || !name.trim()}
            isProcessing={saving}
          >
            Add Section
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// SectionPanel
// ---------------------------------------------------------------------------

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

function SectionPanel({
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
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 flex-1 text-left min-w-0"
        >
          <EditableField
            value={section.name}
            onSave={handleSaveSectionName}
            className="min-w-0"
            renderDisplay={(v) => (
              <span className="font-semibold text-gray-900 dark:text-slate-100">
                {v}
              </span>
            )}
          />
          <span className="rounded-full bg-gray-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-400 shrink-0">
            {localItems.length} {localItems.length === 1 ? "item" : "items"}
          </span>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {formatCurrency(section.subtotal)}
          </span>
          <button
            onClick={() => onDeleteRequest(section.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 focus:opacity-100"
            aria-label="Delete section"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
            onClick={() => setOpen((o) => !o)}
          />
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-200 dark:border-slate-700">
          {localItems.length === 0 ? (
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
                    <th className="px-2 py-2.5 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {localItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors group/row"
                    >
                      {/* Description */}
                      <td className="px-5 py-2 text-gray-900 dark:text-slate-100 min-w-[200px]">
                        <EditableCell
                          value={item.description}
                          type="text"
                          onSave={(v) =>
                            handleSaveItemField(item.id, "description", v)
                          }
                        />
                      </td>
                      {/* Qty */}
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700 dark:text-slate-300 w-20">
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
                      <td className="px-4 py-2 text-gray-700 dark:text-slate-300 w-20">
                        <EditableCell
                          value={item.unit}
                          type="text"
                          onSave={(v) =>
                            handleSaveItemField(item.id, "unit", v)
                          }
                        />
                      </td>
                      {/* Unit Cost */}
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700 dark:text-slate-300 w-28">
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
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700 dark:text-slate-300 w-28">
                        {formatCurrency(item.extendedCost)}
                      </td>
                      {/* Source */}
                      <td className="px-5 py-2">
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
                      {/* Actions */}
                      <td className="px-2 py-2 w-20">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button
                            onClick={() => void handleReorder(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 disabled:opacity-20"
                            aria-label="Move up"
                          >
                            <ChevronUpIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleReorder(index, "down")}
                            disabled={index === localItems.length - 1}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 disabled:opacity-20"
                            aria-label="Move down"
                          >
                            <ChevronDownIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDeleteItem(item.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
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
          <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={() => onAddItem(section.id)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
            >
              + Add Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OptionCard with editable multiplier
// ---------------------------------------------------------------------------

interface OptionCardProps {
  option: Option;
  recommended: boolean;
  projectId: string;
  onRefetch: () => Promise<void>;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

function OptionCard({
  option,
  recommended,
  projectId,
  onRefetch,
  addToast,
}: OptionCardProps) {
  const tierLabels: Record<Option["tier"], string> = {
    good: "Good",
    better: "Better",
    best: "Best",
  };

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
      <EditableField
        value={String(option.multiplier)}
        onSave={handleSaveMultiplier}
        renderDisplay={(v) => (
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {v}x multiplier
          </span>
        )}
        inputClassName="w-24 text-sm"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

  useEffect(() => {
    const jobIdFromUrl = searchParams.get("generating");
    if (jobIdFromUrl) {
      setGeneratingJobId(jobIdFromUrl);
    }
  }, [searchParams]);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-5xl mx-auto">
          <ProjectDetailSkeleton />
        </div>
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
              <EditableField
                value={project.description}
                onSave={handleSaveDescription}
                multiline
                className="mb-1"
                renderDisplay={(v) => (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {v}
                  </h1>
                )}
              />
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
              onClick={() => void handleGenerate()}
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
              onClick={() => void handleDuplicate()}
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
        <div className="flex flex-col gap-4 mb-4">
          {project.sections.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 px-5 py-10 text-center">
              <p className="text-gray-500 dark:text-slate-400 text-sm">
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
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            + Add Section
          </button>
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
                  projectId={id}
                  onRefetch={fetchProject}
                  addToast={addToast}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SSE Progress overlay */}
      <ProgressOverlay
        jobId={generatingJobId}
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
              onClick={() => void handleDelete()}
              disabled={deleting}
              isProcessing={deleting}
            >
              Delete
            </Button>
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
          <p className="text-gray-700 dark:text-slate-300 text-sm">
            Items will be moved to the &ldquo;Other&rdquo; section. This action
            cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              color="gray"
              size="sm"
              onClick={() => setDeleteSectionId(null)}
              disabled={deletingSection}
            >
              Cancel
            </Button>
            <Button
              color="failure"
              size="sm"
              onClick={() => void handleDeleteSection()}
              disabled={deletingSection}
              isProcessing={deletingSection}
            >
              Delete
            </Button>
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
