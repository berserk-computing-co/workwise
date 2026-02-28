"use client";

import React, { useRef, useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  renderDisplay: (value: string) => React.ReactNode;
}

export function EditableField({
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
