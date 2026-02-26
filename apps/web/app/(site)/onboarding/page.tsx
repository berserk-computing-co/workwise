"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";

interface OnboardingForm {
  companyName: string;
  zipCode: string;
}

export default function OnboardingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<OnboardingForm>();

  const onSubmit = async (data: OnboardingForm) => {
    if (!user) return;

    setSubmitting(true);
    setGeneralError(null);
    try {
      const res = await fetch("/api/proxy/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            firstName:
              (user.given_name as string) || user.name?.split(" ")[0] || "",
            lastName:
              (user.family_name as string) ||
              user.name?.split(" ").slice(1).join(" ") ||
              "",
            email: user.email || "",
          },
          organization: {
            name: data.companyName,
            zipCode: data.zipCode,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        if (res.status === 422 && Array.isArray(body.message)) {
          body.message.forEach(
            ({ field, message }: { field: string; message: string }) => {
              if (field === "companyName" || field === "zipCode") {
                setError(field as keyof OnboardingForm, { message });
              }
            },
          );
        } else {
          setGeneralError(body.message || "Something went wrong");
        }
        return;
      }

      router.push("/projects");
    } catch {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="max-w-sm w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800 rounded-2xl p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Welcome{user?.given_name ? `, ${user.given_name}` : ""}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tell us about your company to get started.
          </p>
        </div>

        {generalError && (
          <div className="rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400 mb-4">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                placeholder="Acme Contracting"
                {...register("companyName", {
                  required: "Company name is required",
                })}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white dark:bg-[#0f0f12] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                  errors.companyName
                    ? "border-red-400 dark:border-red-600 focus:ring-red-500/20"
                    : "border-gray-200 dark:border-gray-700 focus:ring-gray-900/10 dark:focus:ring-white/10"
                }`}
              />
              {errors.companyName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                ZIP code
              </label>
              <input
                id="zipCode"
                type="text"
                inputMode="numeric"
                placeholder="12345"
                maxLength={5}
                {...register("zipCode", {
                  required: "ZIP code is required",
                  pattern: {
                    value: /^\d{5}$/,
                    message: "Enter a valid 5-digit ZIP code",
                  },
                })}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white dark:bg-[#0f0f12] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                  errors.zipCode
                    ? "border-red-400 dark:border-red-600 focus:ring-red-500/20"
                    : "border-gray-200 dark:border-gray-700 focus:ring-gray-900/10 dark:focus:ring-white/10"
                }`}
              />
              {errors.zipCode && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.zipCode.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && (
                <div className="h-4 w-4 border-2 border-white/40 border-t-white dark:border-gray-900/40 dark:border-t-gray-900 rounded-full animate-spin" />
              )}
              {submitting ? "Setting up..." : "Get Started"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
