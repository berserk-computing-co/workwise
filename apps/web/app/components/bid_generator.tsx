"use client";

import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useToast } from "@/app/components/toast";
import { ProgressOverlay } from "@/app/components/progress-overlay";
import { AddressAutocomplete } from "@/app/components/address-autocomplete";
import { CreateProjectPayload } from "@/app/types/project-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlowState {
  step: 1 | 2 | 3 | 4;
  address: string;
  formattedAddress: string;
  zipCode: string;
  description: string;
  category: string | null;
  clientName: string;
}

type FlowAction =
  | {
      type: "SET_ADDRESS";
      payload: { address: string; formattedAddress: string; zipCode: string };
    }
  | {
      type: "SET_DESCRIPTION";
      payload: { description: string; category: string | null };
    }
  | { type: "SET_CLIENT"; payload: { clientName: string } }
  | { type: "SKIP_CLIENT" }
  | { type: "GO_BACK" };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const initialState: FlowState = {
  step: 1,
  address: "",
  formattedAddress: "",
  zipCode: "",
  description: "",
  category: null,
  clientName: "",
};

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "SET_ADDRESS":
      return {
        ...state,
        ...action.payload,
        step: 2,
      };
    case "SET_DESCRIPTION":
      return {
        ...state,
        description: action.payload.description,
        category: action.payload.category,
        step: 3,
      };
    case "SET_CLIENT":
      return {
        ...state,
        clientName: action.payload.clientName,
        step: 4,
      };
    case "SKIP_CLIENT":
      return {
        ...state,
        clientName: "",
        step: 4,
      };
    case "GO_BACK":
      return {
        ...state,
        step: Math.max(1, state.step - 1) as 1 | 2 | 3 | 4,
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Kitchen",
  "Bathroom",
  "Roofing",
  "General Renovation",
  "Painting",
  "Flooring",
  "HVAC",
  "Landscaping",
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BotCard({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1e] rounded-xl p-5 border border-gray-100 dark:border-gray-800 flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm select-none">
        ✦
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function LockedAnswerCard({
  label,
  value,
  onEdit,
}: {
  label?: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white dark:bg-[#0f0f12] rounded-xl p-5 border border-gray-100 dark:border-gray-800 ml-6 flex items-start justify-between gap-3">
      <div>
        {label && (
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
            {label}
          </p>
        )}
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
          {value}
        </p>
      </div>
      <button
        onClick={onEdit}
        className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none rounded transition-colors"
      >
        Change
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Address
// ---------------------------------------------------------------------------

function Step1Address({
  onNext,
}: {
  onNext: (payload: {
    address: string;
    formattedAddress: string;
    zipCode: string;
  }) => void;
}) {
  return (
    <div className="space-y-3">
      <BotCard
        title="Where's the job site?"
        subtitle="We use the location to pull accurate local material and labor rates."
      />
      <div className="bg-white dark:bg-[#0f0f12] border border-gray-100 dark:border-gray-800 rounded-xl p-4">
        <AddressAutocomplete onSelect={onNext} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Description
// ---------------------------------------------------------------------------

function Step2Description({
  onNext,
}: {
  onNext: (payload: { description: string; category: string | null }) => void;
}) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleCategoryToggle = (cat: string) => {
    setCategory((prev) => (prev === cat ? null : cat));
  };

  const canContinue = description.trim().length >= 20;

  const handleSubmit = () => {
    if (!canContinue) return;
    onNext({ description: description.trim(), category });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canContinue) {
      handleSubmit();
    }
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="space-y-3">
      <BotCard
        title="Describe the scope of work."
        subtitle="Mention what's being replaced, rough sizes, and materials if you know them — more detail means tighter line items."
      />
      <div className="space-y-3">
        <textarea
          ref={textareaRef}
          value={description}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={
            category
              ? `Describe the ${category.toLowerCase()} work — what specifically needs to be done...`
              : "Describe the scope — what's being replaced, room sizes, materials, any known constraints..."
          }
          rows={3}
          className="w-full bg-white dark:bg-[#0f0f12] border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 overflow-hidden transition-all"
          style={{ minHeight: "80px", maxHeight: "200px" }}
        />

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryToggle(cat)}
              className={`rounded-full px-3 py-1.5 text-sm border transition-colors cursor-pointer ${
                category === cat
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {description.trim().length < 20
              ? `${20 - description.trim().length} more characters needed`
              : "Press ⌘↵ or click Continue"}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!canContinue}
            className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Client info
// ---------------------------------------------------------------------------

function Step3Client({
  onNext,
  onSkip,
}: {
  onNext: (payload: { clientName: string }) => void;
  onSkip: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onNext({ clientName: clientName.trim() });
    }
  };

  return (
    <div className="space-y-3">
      <BotCard
        title="Who's this estimate for?"
        subtitle="Adding a client name makes the estimate look polished when you share it. Easy to add later too."
      />
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Client name"
          className="w-full bg-white dark:bg-[#0f0f12] border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-colors"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 focus:outline-none rounded transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onNext({ clientName: clientName.trim() })}
            className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Summary + Generate (auth-aware)
// ---------------------------------------------------------------------------

function Step4Summary({
  state,
  isLoggedIn,
  onSaveDraft,
  onGenerate,
  submitting,
}: {
  state: FlowState;
  isLoggedIn: boolean;
  onSaveDraft: () => void;
  onGenerate: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-3">
      <BotCard
        title={isLoggedIn ? "Ready to build your estimate." : "Almost there."}
        subtitle={
          isLoggedIn
            ? "We'll break this into scoped sections, pull local pricing, and generate itemized line items with options to review. Takes about 30 seconds."
            : "Create a free account to generate your estimate — takes 10 seconds."
        }
      />
      <div className="bg-gray-50 dark:bg-[#1a1a1e] rounded-xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
              Address
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              {state.formattedAddress}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
              Description
            </p>
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {state.description}
            </p>
          </div>
          {state.category && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                Category
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                {state.category}
              </p>
            </div>
          )}
          {state.clientName && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                Client
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                {state.clientName}
              </p>
            </div>
          )}
        </div>

        <div className="pt-1 flex flex-col sm:flex-row gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={onSaveDraft}
                disabled={submitting}
                className="flex-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={onGenerate}
                disabled={submitting}
                className="flex-1 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {submitting ? "Creating..." : "Build My Estimate"}
              </button>
            </>
          ) : (
            <a
              href="/api/auth/login"
              className="flex-1 inline-flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Sign up to Generate
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BidGenerator() {
  const router = useRouter();
  const { user } = useUser();
  const { addToast } = useToast();
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const [submitting, setSubmitting] = useState(false);
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);

  const stepRefs = [step1Ref, step2Ref, step3Ref, step4Ref];

  useEffect(() => {
    const ref = stepRefs[state.step - 1];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetAddress = useCallback(
    (payload: {
      address: string;
      formattedAddress: string;
      zipCode: string;
    }) => {
      dispatch({ type: "SET_ADDRESS", payload });
    },
    [],
  );

  const handleSetDescription = useCallback(
    (payload: { description: string; category: string | null }) => {
      dispatch({ type: "SET_DESCRIPTION", payload });
    },
    [],
  );

  const handleSetClient = useCallback((payload: { clientName: string }) => {
    dispatch({ type: "SET_CLIENT", payload });
  }, []);

  const handleSkipClient = useCallback(() => {
    dispatch({ type: "SKIP_CLIENT" });
  }, []);

  const createProject = async (): Promise<{ id: string } | null> => {
    const payload: CreateProjectPayload = {
      description: state.description,
      address: state.formattedAddress,
      zipCode: state.zipCode,
      category: state.category || undefined,
      clientName: state.clientName || undefined,
    };

    const res = await fetch("/api/proxy/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { message?: string }).message || "Failed to create project",
      );
    }

    return res.json();
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      const project = await createProject();
      if (project) {
        router.push(`/projects/${project.id}`);
      }
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to save project",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    try {
      const project = await createProject();
      if (!project) return;

      setProjectId(project.id);

      const genRes = await fetch(`/api/proxy/projects/${project.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        throw new Error("Failed to start generation");
      }

      const { jobId } = await genRes.json();
      setGeneratingJobId(jobId);
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to generate estimate",
      );
    } finally {
      setSubmitting(false);
    }
  };

  function handleGenerateComplete() {
    setGeneratingJobId(null);
    if (projectId) {
      router.push(`/projects/${projectId}`);
    }
  }

  function handleProgressClose() {
    setGeneratingJobId(null);
    if (projectId) {
      router.push(`/projects/${projectId}`);
    }
  }

  const isLoggedIn = !!user;

  return (
    <>
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Your next bid, in minutes.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Answer 3 quick questions and get a fully itemized estimate — with
            local material costs and labor pricing — ready to send.
          </p>
        </div>

        {/* Step 1 */}
        <div ref={step1Ref}>
          {state.step === 1 ? (
            <Step1Address onNext={handleSetAddress} />
          ) : (
            <div className="space-y-3">
              <BotCard
                title="Where's the job site?"
                subtitle="We use the location to pull accurate local material and labor rates."
              />
              <LockedAnswerCard
                label="Address"
                value={state.formattedAddress}
                onEdit={() => dispatch({ type: "GO_BACK" })}
              />
            </div>
          )}
        </div>

        {/* Step 2 */}
        {state.step >= 2 && (
          <div ref={step2Ref}>
            {state.step === 2 ? (
              <Step2Description onNext={handleSetDescription} />
            ) : (
              <div className="space-y-3">
                <BotCard
                  title="What work needs to be done?"
                  subtitle="Be as detailed as you can — it helps us generate a more accurate estimate."
                />
                <LockedAnswerCard
                  label={
                    state.category
                      ? `${state.category} — Description`
                      : "Description"
                  }
                  value={state.description}
                  onEdit={() => {
                    dispatch({ type: "GO_BACK" });
                    if (state.step > 3) dispatch({ type: "GO_BACK" });
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {state.step >= 3 && (
          <div ref={step3Ref}>
            {state.step === 3 ? (
              <Step3Client onNext={handleSetClient} onSkip={handleSkipClient} />
            ) : (
              <div className="space-y-3">
                <BotCard
                  title="Who's the client?"
                  subtitle="Optional — you can add this later."
                />
                <LockedAnswerCard
                  label="Client"
                  value={state.clientName || "Skipped"}
                  onEdit={() => dispatch({ type: "GO_BACK" })}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {state.step >= 4 && (
          <div ref={step4Ref}>
            <Step4Summary
              state={state}
              isLoggedIn={isLoggedIn}
              onSaveDraft={handleSaveDraft}
              onGenerate={handleGenerate}
              submitting={submitting}
            />
          </div>
        )}
      </div>

      <ProgressOverlay
        jobId={generatingJobId}
        onComplete={handleGenerateComplete}
        onClose={handleProgressClose}
      />
    </>
  );
}
