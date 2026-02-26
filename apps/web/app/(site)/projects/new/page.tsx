"use client";

import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import GooglePlacesAutocomplete, {
  geocodeByPlaceId,
} from "react-google-places-autocomplete";
import { useToast } from "@/app/components/toast";
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
    <div className="border-l-4 border-blue-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-base select-none">
        🤖
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-slate-100">
          {title}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
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
    <div className="bg-blue-50 dark:bg-slate-750 border border-gray-200 dark:border-slate-700 rounded-lg p-3 flex items-start justify-between gap-3">
      <div>
        {label && (
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            {label}
          </p>
        )}
        <p className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap break-words">
          {value}
        </p>
      </div>
      <button
        onClick={onEdit}
        className="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
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
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [value, setValue] = useState<{
    label: string;
    value: { place_id: string };
  } | null>(null);
  const [picking, setPicking] = useState(false);

  const handleSelect = useCallback(
    async (selected: { label: string; value: { place_id: string } } | null) => {
      if (!selected) return;
      setValue(selected);
      setPicking(true);
      try {
        const results = await geocodeByPlaceId(selected.value.place_id);
        const result = results[0];
        const formattedAddress = result.formatted_address;

        let zipCode = "";
        for (const component of result.address_components) {
          if (component.types.includes("postal_code")) {
            zipCode = component.long_name;
            break;
          }
        }

        onNext({
          address: selected.label,
          formattedAddress,
          zipCode,
        });
      } catch {
        // stay on step
      } finally {
        setPicking(false);
      }
    },
    [onNext],
  );

  return (
    <div className="space-y-3">
      <BotCard
        title="Where's the project?"
        subtitle="Enter the project address to get started."
      />
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        {mapsLoaded ? (
          <GooglePlacesAutocomplete
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            selectProps={{
              value,
              onChange: handleSelect,
              placeholder: "Start typing an address...",
              isClearable: true,
              isDisabled: picking,
              classNamePrefix: "gpa",
              styles: {
                control: (base) => ({
                  ...base,
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  boxShadow: "none",
                  padding: "2px 4px",
                  "&:hover": { borderColor: "#3b82f6" },
                }),
                input: (base) => ({ ...base, color: "inherit" }),
                menu: (base) => ({ ...base, zIndex: 50 }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "#eff6ff" : "white",
                  color: "#111827",
                  cursor: "pointer",
                }),
              },
            }}
          />
        ) : (
          <input
            type="text"
            disabled
            placeholder="Loading address search..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400 bg-gray-50"
          />
        )}
        {picking && (
          <p className="mt-2 text-xs text-gray-400">
            Fetching address details...
          </p>
        )}
      </div>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />
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
        title="What work needs to be done?"
        subtitle="Be as detailed as you can — it helps us generate a more accurate estimate."
      />
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm space-y-3">
        <textarea
          ref={textareaRef}
          value={description}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={
            category
              ? `Describe the ${category.toLowerCase()} work — what specifically needs to be done...`
              : "Describe the project — what rooms, what kind of work, any specific materials or requirements..."
          }
          rows={3}
          className="w-full rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-2 text-base text-gray-900 dark:text-slate-100 bg-transparent placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none overflow-hidden transition-all"
          style={{ minHeight: "80px", maxHeight: "200px" }}
        />

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryToggle(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            {description.trim().length < 20
              ? `${20 - description.trim().length} more characters needed`
              : "Press ⌘↵ or click Continue"}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!canContinue}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        title="Who's the client?"
        subtitle="Optional — you can add this later."
      />
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Client name"
          className="w-full rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-2 text-base text-gray-900 dark:text-slate-100 bg-transparent placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            Skip
          </button>
          <button
            onClick={() => onNext({ clientName: clientName.trim() })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Summary + Generate
// ---------------------------------------------------------------------------

function Step4Summary({
  state,
  onSaveDraft,
  onGenerate,
  submitting,
}: {
  state: FlowState;
  onSaveDraft: () => void;
  onGenerate: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-3">
      <BotCard
        title="Ready to go!"
        subtitle="Review your project details below."
      />
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm space-y-3">
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
              Address
            </p>
            <p className="text-gray-800 dark:text-slate-200">
              {state.formattedAddress}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
              Description
            </p>
            <p className="text-gray-800 dark:text-slate-200 whitespace-pre-wrap">
              {state.description}
            </p>
          </div>
          {state.category && (
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
                Category
              </p>
              <p className="text-gray-800 dark:text-slate-200">
                {state.category}
              </p>
            </div>
          )}
          {state.clientName && (
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
                Client
              </p>
              <p className="text-gray-800 dark:text-slate-200">
                {state.clientName}
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onSaveDraft}
            disabled={submitting}
            className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Saving..." : "Save as Draft"}
          </button>
          <button
            onClick={onGenerate}
            disabled={submitting}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Creating..." : "Generate Estimate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewProjectPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const [submitting, setSubmitting] = useState(false);

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

      const genRes = await fetch(`/api/proxy/projects/${project.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        throw new Error("Failed to start generation");
      }

      const { jobId } = await genRes.json();
      router.push(`/projects/${project.id}?generating=${jobId}`);
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to generate estimate",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/projects")}
            className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            ← Back to Projects
          </button>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-slate-100">
            New Project
          </h1>
        </div>

        {/* Step 1 */}
        <div ref={step1Ref}>
          {state.step === 1 ? (
            <Step1Address onNext={handleSetAddress} />
          ) : (
            <div className="space-y-3">
              <BotCard
                title="Where's the project?"
                subtitle="Enter the project address to get started."
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
              onSaveDraft={handleSaveDraft}
              onGenerate={handleGenerate}
              submitting={submitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
