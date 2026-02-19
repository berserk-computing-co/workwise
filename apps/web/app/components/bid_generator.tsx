"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Button, Card, Spinner } from "flowbite-react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

// --- Types ---

type PageState = "idle" | "loading" | "done";

const PROGRESS_STEPS = [
  { label: "Analyzing project", detail: "Reading your description..." },
  { label: "Looking up prices", detail: "Searching 1Build for materials & labor..." },
  { label: "Generating PDF", detail: "Building your bid document..." },
];

// --- Sub-views ---

function IdleView({
  description,
  onDescriptionChange,
  email,
  onEmailChange,
  zip,
  onZipChange,
  imageFile,
  onImageChange,
  onSubmit,
  error,
}: {
  description: string;
  onDescriptionChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  zip: string;
  onZipChange: (v: string) => void;
  imageFile: File | null;
  onImageChange: (f: File | null) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <Image src="/workwise.png" width={300} height={150} alt="Workwise" priority />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Generate a Bid Instantly</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1 text-sm">
          Describe your project and we&apos;ll generate an AI-powered bid estimate and send it to our network of licensed contractors. Your bid is tentative until a contractor reviews and accepts it.
        </p>
      </div>

      <div className="w-full">
        <textarea
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:border-blue-400 dark:placeholder-slate-400"
          style={{ minHeight: 140 }}
          placeholder="e.g. Build a 500 sq ft cedar deck in the backyard with stairs and railing..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>

      <div className="w-full">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:border-blue-400 dark:placeholder-slate-400"
          placeholder="ZIP code"
          aria-label="ZIP code"
          value={zip}
          onChange={(e) => onZipChange(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <div className="w-full">
        <input
          type="email"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:border-blue-400 dark:placeholder-slate-400"
          placeholder="you@example.com"
          aria-label="Your email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col items-start w-full gap-2">
        <button
          type="button"
          className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 focus:outline-none"
          onClick={() => fileInputRef.current?.click()}
        >
          📷 Attach a photo (optional){imageFile ? ` — ${imageFile.name}` : ""}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && (
        <div className="w-full rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <Button
        color="blue"
        onClick={onSubmit}
        disabled={!description.trim() || !email.trim() || zip.length !== 5}
        className="w-full"
      >
        Generate Bid
      </Button>
    </div>
  );
}

function LoadingView({ stepIndex }: { stepIndex: number }) {
  const step = PROGRESS_STEPS[stepIndex] ?? PROGRESS_STEPS[PROGRESS_STEPS.length - 1];

  return (
    <div className="flex flex-col items-center gap-8 w-full py-4">
      <Spinner size="xl" color="blue" />
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-slate-100">{step.label}</p>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{step.detail}</p>
      </div>

      {/* Dot progress indicator */}
      <div className="flex gap-3">
        {PROGRESS_STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors duration-500 ${
              i <= stepIndex ? "bg-blue-500 dark:bg-blue-400" : "bg-slate-300 dark:bg-slate-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function DoneView({
  onDownload,
  onReset,
}: {
  onDownload: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full py-4">
      <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Your bid is ready!</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          The PDF includes real material and labor pricing.
        </p>
      </div>
      <Button color="blue" onClick={onDownload} className="w-full">
        Download PDF
      </Button>
      <Button color="light" onClick={onReset} className="w-full">
        Start Over
      </Button>
    </div>
  );
}

// --- Main component ---

export function BidGenerator() {
  const [pageState, setPageState] = useState<PageState>("idle");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  // Store blob URL in a ref to avoid stale closures and prevent re-renders
  const blobUrlRef = useRef<string | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance progress steps every 5 seconds while loading
  useEffect(() => {
    if (pageState === "loading") {
      setStepIndex(0);
      stepIntervalRef.current = setInterval(() => {
        setStepIndex((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1));
      }, 5000);
    } else {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
    }
    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [pageState]);

  async function handleSubmit() {
    setError(null);
    setPageState("loading");

    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("email", email);
      formData.append("zip", zip);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Do NOT set Content-Type — browser sets it with the correct multipart boundary
      const response = await fetch("/api/bids/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Generation failed");
      }

      const blob = await response.blob();
      blobUrlRef.current = URL.createObjectURL(blob);
      setPageState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPageState("idle");
    }
  }

  function handleDownload() {
    if (!blobUrlRef.current) return;
    const a = document.createElement("a");
    a.href = blobUrlRef.current;
    a.download = "bid.pdf";
    a.click();
  }

  function handleReset() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setDescription("");
    setEmail("");
    setZip("");
    setImageFile(null);
    setError(null);
    setPageState("idle");
  }

  return (
    <div className="flex justify-center w-full">
      <Card className="bg-blue-100 dark:bg-slate-800 w-full max-w-2xl p-8">
        {pageState === "idle" && (
          <IdleView
            description={description}
            onDescriptionChange={setDescription}
            email={email}
            onEmailChange={setEmail}
            zip={zip}
            onZipChange={setZip}
            imageFile={imageFile}
            onImageChange={setImageFile}
            onSubmit={handleSubmit}
            error={error}
          />
        )}
        {pageState === "loading" && <LoadingView stepIndex={stepIndex} />}
        {pageState === "done" && (
          <DoneView onDownload={handleDownload} onReset={handleReset} />
        )}
      </Card>
    </div>
  );
}
