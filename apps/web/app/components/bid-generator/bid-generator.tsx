"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useToast } from "@/app/components/toast";
import { ProgressOverlay } from "@/app/components/progress-overlay";
import { CreateProjectPayload } from "@/app/types/project-api";
import { flowReducer, initialState } from "./types";
import { BotCard } from "./bot-card";
import { LockedAnswerCard } from "./locked-answer-card";
import { Step1Address } from "./step-address";
import { Step2Description } from "./step-description";
import { Step3Client } from "./step-client";
import { Step4Summary } from "./step-summary";

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
            Generate an Estimate
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Describe your project and we&apos;ll generate an AI-powered estimate
            with real material and labor pricing.
          </p>
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
              <Step3Client
                onNext={handleSetClient}
                onSkip={handleSkipClient}
              />
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
        projectId={projectId}
        onComplete={handleGenerateComplete}
        onClose={handleProgressClose}
      />
    </>
  );
}
