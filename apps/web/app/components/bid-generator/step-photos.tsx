"use client";

import { useEffect, useRef, useState } from "react";
import { BotCard } from "./bot-card";
import type { UploadedFile } from "./types";
import {
  uploadProjectFile,
  deleteProjectFile,
  validateImageFile,
} from "@/lib/files-api";

const MAX_FILES = 5;

interface UploadedFileWithPreview extends UploadedFile {
  previewUrl: string;
}

interface Props {
  projectId: string;
  onNext: (payload: { files: UploadedFile[] }) => void;
  onSkip: () => void;
}

export function StepPhotos({ projectId, onNext, onSkip }: Props) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileWithPreview[]>(
    [],
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function processFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const remaining = MAX_FILES - uploadedFiles.length;
    if (remaining <= 0) return;

    const toUpload = fileArray.slice(0, remaining);
    const errors: string[] = [];

    for (const file of toUpload) {
      const validationError = validateImageFile(file);
      if (validationError) {
        errors.push(validationError);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const results = await Promise.all(
        toUpload.map(async (file) => {
          const uploaded = await uploadProjectFile(projectId, file);
          const previewUrl = URL.createObjectURL(file);
          objectUrlsRef.current.set(uploaded.id, previewUrl);
          return { ...uploaded, previewUrl };
        }),
      );

      setUploadedFiles((prev) => [...prev, ...results]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload one or more files.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      void processFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processFiles(e.dataTransfer.files);
    }
  }

  async function handleRemove(fileId: string) {
    try {
      await deleteProjectFile(fileId);
    } catch {
      // best-effort delete
    }
    const previewUrl = objectUrlsRef.current.get(fileId);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      objectUrlsRef.current.delete(fileId);
    }
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  const atLimit = uploadedFiles.length >= MAX_FILES;
  const hasFiles = uploadedFiles.length > 0;

  function handleContinue() {
    if (!hasFiles) {
      onSkip();
    } else {
      onNext({ files: uploadedFiles.map(({ previewUrl: _p, ...f }) => f) });
    }
  }

  return (
    <div className="space-y-3">
      <BotCard
        title="Got photos of the project?"
        subtitle="Optional — photos help us generate more accurate estimates."
      />

      <div className="space-y-3">
        {!atLimit ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
              isDragOver
                ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800/50"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
            ].join(" ")}
          >
            <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5v-9m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-1.043A3.75 3.75 0 0 1 17.25 19.5H6.75Z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Drop images here or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                JPEG, PNG, WebP, HEIC — max 10MB each
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
            Maximum 5 photos reached
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={handleInputChange}
        />

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {uploading && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            Uploading…
          </p>
        )}

        {hasFiles && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.previewUrl}
                  alt={file.fileName}
                  className="w-full h-24 object-cover"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate px-1 py-0.5">
                  {file.fileName}
                </p>
                <button
                  type="button"
                  onClick={() => void handleRemove(file.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${file.fileName}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 focus:outline-none rounded transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={uploading}
            className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {hasFiles ? "Continue" : "Continue without photos"}
          </button>
        </div>
      </div>
    </div>
  );
}
