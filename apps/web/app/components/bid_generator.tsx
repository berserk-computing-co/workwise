"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
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

// Step advances: first step at 3s, second at 20s, last step holds indefinitely
const STEP_DELAYS_MS = [3000, 20000];

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
  onRetry,
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
  onRetry: (() => void) | null;
  error: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zipTouched, setZipTouched] = useState(false);

  const zipError = zipTouched && zip.length > 0 && zip.length < 5 ? "ZIP code must be 5 digits" : null;

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
          className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 ${
            zipError
              ? "border-red-400 focus:border-red-500 focus:ring-red-400 dark:border-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:focus:border-blue-400"
          }`}
          placeholder="ZIP code"
          aria-label="ZIP code"
          value={zip}
          onChange={(e) => {
            onZipChange(e.target.value.replace(/\D/g, ""));
            setZipTouched(true);
          }}
          onBlur={() => setZipTouched(true)}
        />
        {zipError && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{zipError}</p>
        )}
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
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none"
            >
              Try again
            </button>
          )}
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

function LoadingView({
  stepIndex,
  elapsedSeconds,
  onCancel,
}: {
  stepIndex: number;
  elapsedSeconds: number;
  onCancel: () => void;
}) {
  const step = PROGRESS_STEPS[stepIndex] ?? PROGRESS_STEPS[PROGRESS_STEPS.length - 1];

  return (
    <div className="flex flex-col items-center gap-8 w-full py-4">
      <Spinner size="xl" color="blue" />
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-slate-100">{step.label}</p>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{step.detail}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">This usually takes 1–3 minutes</p>
        {elapsedSeconds >= 30 && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">~{elapsedSeconds}s elapsed</p>
        )}
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

      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 focus:outline-none underline"
      >
        Cancel
      </button>
    </div>
  );
}

function DoneView({
  onDownload,
  onReset,
  bidName,
  bidTotal,
  bidItemCount,
}: {
  onDownload: () => void;
  onReset: () => void;
  bidName: string | null;
  bidTotal: number | null;
  bidItemCount: number | null;
}) {
  const formattedTotal =
    bidTotal != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(bidTotal)
      : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full py-4">
      <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Your bid is ready!</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          The PDF includes real material and labor pricing.
        </p>
      </div>

      {(bidName || formattedTotal || bidItemCount != null) && (
        <div className="w-full rounded-lg border border-gray-200 bg-white dark:bg-slate-700 dark:border-slate-600 px-5 py-4 text-left">
          {bidName && (
            <p className="text-base font-semibold text-gray-800 dark:text-slate-100">{bidName}</p>
          )}
          {formattedTotal && (
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
              Estimated total: <span className="font-medium">{formattedTotal}</span>
            </p>
          )}
          {bidItemCount != null && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {bidItemCount} line item{bidItemCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      <Button color="blue" onClick={onDownload} className="w-full">
        Download PDF
      </Button>
      <Button color="light" onClick={onReset} className="w-full">
        Generate Another
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bidName, setBidName] = useState<string | null>(null);
  const [bidTotal, setBidTotal] = useState<number | null>(null);
  const [bidItemCount, setBidItemCount] = useState<number | null>(null);

  // Store blob URL in a ref to avoid stale closures and prevent re-renders
  const blobUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set up adaptive step timing and elapsed counter when loading starts
  useEffect(() => {
    if (pageState === "loading") {
      setStepIndex(0);
      setElapsedSeconds(0);

      // Adaptive step advances
      stepTimersRef.current = STEP_DELAYS_MS.map((delay, i) =>
        setTimeout(() => setStepIndex(i + 1), delay)
      );

      // Elapsed seconds counter
      const startTime = Date.now();
      elapsedIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      stepTimersRef.current.forEach(clearTimeout);
      stepTimersRef.current = [];
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
    }

    return () => {
      stepTimersRef.current.forEach(clearTimeout);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, [pageState]);

  function categorizeError(status: number, body: string): string {
    if (status === 429) return "Too many requests — please try again in a few minutes.";
    if (status === 524 || status === 408) return "This is taking longer than expected. Try again — the server may be under load.";
    if (status === 422) return body || "Invalid input — please check your details.";
    if (status >= 500) return "Something went wrong on our end. Please try again.";
    return body || "Something went wrong. Please check your connection and try again.";
  }

  const handleSubmit = useCallback(async () => {
    setError(null);
    setPageState("loading");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("email", email.trim());
      formData.append("zip", zip);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch("/api/bids/generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw Object.assign(new Error(categorizeError(response.status, text)), { status: response.status });
      }

      // Read bid metadata from response headers
      const nameHeader = response.headers.get("x-bid-name");
      const totalHeader = response.headers.get("x-bid-total");
      const countHeader = response.headers.get("x-bid-item-count");

      setBidName(nameHeader);
      setBidTotal(totalHeader ? parseFloat(totalHeader) : null);
      setBidItemCount(countHeader ? parseInt(countHeader, 10) : null);

      const blob = await response.blob();
      blobUrlRef.current = URL.createObjectURL(blob);
      setPageState("done");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled — reset silently
        setPageState("idle");
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong. Please check your connection and try again.");
      setPageState("idle");
    } finally {
      abortControllerRef.current = null;
    }
  }, [description, email, zip, imageFile]);

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  function handleDownload() {
    if (!blobUrlRef.current) return;
    const a = document.createElement("a");
    a.href = blobUrlRef.current;
    a.download = bidName ? `bid-${bidName.toLowerCase().replace(/\s+/g, "-")}.pdf` : "bid.pdf";
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
    setBidName(null);
    setBidTotal(null);
    setBidItemCount(null);
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
            onRetry={error ? handleSubmit : null}
            error={error}
          />
        )}
        {pageState === "loading" && (
          <LoadingView
            stepIndex={stepIndex}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
          />
        )}
        {pageState === "done" && (
          <DoneView
            onDownload={handleDownload}
            onReset={handleReset}
            bidName={bidName}
            bidTotal={bidTotal}
            bidItemCount={bidItemCount}
          />
        )}
      </Card>
    </div>
  );
}
