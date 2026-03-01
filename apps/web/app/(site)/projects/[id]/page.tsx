"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Modal, TextInput, Label } from "flowbite-react";
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
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  generating:
    "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 animate-pulse",
  review: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  sent: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  accepted:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
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
        "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1e] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10",
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
        className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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
          "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1e] px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10",
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
        "w-full text-left rounded px-1 py-0.5 -mx-1 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-text",
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
// MobileItemRow — swipeable card row shown below md breakpoint
// ---------------------------------------------------------------------------

const SWIPE_DELETE_THRESHOLD = 60;
const SWIPE_MAX = 80;

interface MobileItemRowProps {
  item: Item;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onReorderUp: () => void;
  onReorderDown: () => void;
}

function MobileItemRow({
  item,
  index,
  total,
  onEdit,
  onDelete,
  onReorderUp,
  onReorderDown,
}: MobileItemRowProps) {
  const touchStartX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    if (delta < 0) {
      setSwipeOffset(Math.max(delta, -SWIPE_MAX));
    }
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (swipeOffset < -SWIPE_DELETE_THRESHOLD) {
      setSwipeOffset(0);
      onDelete();
    } else {
      setSwipeOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
      {/* Delete zone underneath card */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-500 text-white">
        <TrashIcon className="h-5 w-5" />
      </div>
      {/* Card content — translates left on swipe */}
      <div
        className="relative bg-white dark:bg-[#111113]"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swiping ? "none" : "transform 200ms ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-3">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1.5">
            {item.description}
          </p>
          <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>
              {item.quantity} {item.unit}
            </span>
            <span>@ {formatCurrency(item.unitCost)}</span>
            <span className="text-right font-semibold text-gray-700 dark:text-gray-300">
              {formatCurrency(item.extendedCost)}
            </span>
          </div>
          {item.source && (
            <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-2">
              {item.source}
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={onReorderUp}
              disabled={index === 0}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-20"
              aria-label="Move up"
            >
              <ChevronUpIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onReorderDown}
              disabled={index === total - 1}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-20"
              aria-label="Move down"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="ml-auto flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 transition-colors"
              aria-label="Edit item"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ItemEditBottomSheet — slide-up edit panel for mobile
// ---------------------------------------------------------------------------

interface ItemEditBottomSheetProps {
  item: Item;
  onClose: () => void;
  onSave: (
    itemId: string,
    updates: Partial<
      Pick<Item, "description" | "quantity" | "unit" | "unitCost">
    >,
  ) => Promise<void>;
}

function ItemEditBottomSheet({
  item,
  onClose,
  onSave,
}: ItemEditBottomSheetProps) {
  const [description, setDescription] = useState(item.description);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit);
  const [unitCost, setUnitCost] = useState(String(item.unitCost));
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id, {
        description: description.trim(),
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        unitCost: parseFloat(unitCost),
      });
      handleClose();
    } catch {
      // parent handles error toast
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1e] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10";
  const labelCls =
    "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={handleClose}
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 inset-x-0 z-50 md:hidden bg-white dark:bg-[#111113] rounded-t-2xl p-6 pb-8 transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Edit Item
        </h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Qty</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="any"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Unit Cost</label>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                step="0.01"
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex-1 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// MobileSectionTabs — sticky horizontal pill tab bar shown below md breakpoint
// ---------------------------------------------------------------------------

interface MobileSectionTabsProps {
  sections: Section[];
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

function MobileSectionTabs({ sections, sectionRefs }: MobileSectionTabsProps) {
  const [activeSection, setActiveSection] = useState<string | null>(
    sections[0]?.id ?? null,
  );

  useEffect(() => {
    if (sections.length === 0) return;

    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const el = sectionRefs.current[section.id];
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveSection(section.id);
          });
        },
        { threshold: 0.2, rootMargin: "-60px 0px -40% 0px" },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections, sectionRefs]);

  const scrollToSection = (sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActiveSection(sectionId);
  };

  if (sections.length === 0) return null;

  return (
    <div className="sticky top-0 z-20 md:hidden bg-white/90 dark:bg-[#0d0d10]/90 backdrop-blur border-b border-gray-100 dark:border-gray-800 -mx-6 px-6 mb-3">
      <div className="flex gap-2 overflow-x-auto py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeSection === section.id
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {section.name}
          </button>
        ))}
      </div>
    </div>
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
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Adding…" : "Add Item"}
            </button>
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
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-colors"
        />
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !name.trim()}
            className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add Section"}
          </button>
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

const SectionPanel = React.forwardRef<HTMLDivElement, SectionPanelProps>(
  function SectionPanel(
    {
      section,
      projectId,
      onRefetch,
      addToast,
      onDeleteRequest,
      onAddItem,
    }: SectionPanelProps,
    ref,
  ) {
    const [open, setOpen] = useState(true);
    const [localItems, setLocalItems] = useState<Item[]>(section.items);
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

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
          (err as { message?: string }).message ??
            "Failed to save section name",
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

    const handleSaveItem = async (
      itemId: string,
      updates: Partial<
        Pick<Item, "description" | "quantity" | "unit" | "unitCost">
      >,
    ) => {
      // Optimistic update
      setLocalItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const updated = { ...item, ...updates };
          updated.extendedCost =
            (updates.quantity ?? item.quantity) *
            (updates.unitCost ?? item.unitCost);
          return updated;
        }),
      );

      const res = await fetch(
        `/api/proxy/projects/${projectId}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addToast(
          "error",
          (err as { message?: string }).message ?? "Failed to save item",
        );
        setLocalItems(section.items);
        throw new Error("save failed");
      }
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

      const res = await fetch(
        `/api/proxy/projects/${projectId}/items/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: section.id,
            itemIds: items.map((i) => i.id),
          }),
        },
      );
      if (!res.ok) {
        addToast("error", "Failed to reorder items");
        setLocalItems(section.items);
      }
    };

    return (
      <div
        ref={ref}
        className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden"
      >
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
              <>
                {/* Desktop table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                                onClick={() =>
                                  void handleReorder(index, "down")
                                }
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

                {/* Mobile card list (< md) */}
                <div className="md:hidden flex flex-col gap-2 p-3">
                  {localItems.map((item, idx) => (
                    <MobileItemRow
                      key={item.id}
                      item={item}
                      index={idx}
                      total={localItems.length}
                      onEdit={() => setEditingItem(item)}
                      onDelete={() => void handleDeleteItem(item.id)}
                      onReorderUp={() => void handleReorder(idx, "up")}
                      onReorderDown={() => void handleReorder(idx, "down")}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Bottom sheet for editing items on mobile */}
            {editingItem && (
              <ItemEditBottomSheet
                item={editingItem}
                onClose={() => setEditingItem(null)}
                onSave={handleSaveItem}
              />
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
  },
);

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

  // Section refs for MobileSectionTabs scroll tracking
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
        prev
          ? { ...prev, status: "generating" as const, currentJobId: jobId }
          : prev,
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
              {generating ? "Generating…" : "Regenerate"}
            </button>
          )}
          <button
            disabled={duplicating}
            onClick={() => void handleDuplicate()}
            className="rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            {duplicating ? "Duplicating…" : "Duplicate"}
          </button>
          <button className="rounded-full border border-gray-200 dark:border-green-700 text-green-700 dark:text-green-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40">
            Share
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-full border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 px-5 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Mobile section tab bar */}
      {project.sections.length > 0 && (
        <MobileSectionTabs
          sections={project.sections}
          sectionRefs={sectionRefs}
        />
      )}

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
              ref={(el) => {
                sectionRefs.current[section.id] = el;
              }}
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
