"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "flowbite-react";

interface AddSectionModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

export function AddSectionModal({
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
