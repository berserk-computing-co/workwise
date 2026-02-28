"use client";

import React, { useRef, useState } from "react";

interface EditableCellProps {
  value: string | number;
  type?: "text" | "number";
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  step?: string;
}

export function EditableCell({
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
