"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/app/hooks/use-backend-user";

interface OnboardingForm {
  firstName: string;
  lastName: string;
  companyName: string;
  zipCode: string;
}

export default function OnboardingPage() {
  const { user, isLoading } = useUser();
  const { refetch } = useUserContext();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Pre-fill from Auth0 profile where available
  const defaultFirstName =
    (user?.given_name as string) ??
    (user?.name && !user.name.includes("@") ? user.name.split(" ")[0] : "") ??
    "";
  const defaultLastName =
    (user?.family_name as string) ??
    (user?.name && !user.name.includes("@")
      ? user.name.split(" ").slice(1).join(" ")
      : "") ??
    "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingForm>({
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
    },
  });

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
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: user.email || "",
          },
          organization: {
            name: data.companyName.trim(),
            zipCode: data.zipCode.trim(),
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setGeneralError(
          typeof body.message === "string"
            ? body.message
            : "Something went wrong",
        );
        return;
      }

      // Refresh the user context so the guard lets us through
      await refetch();
      router.push("/projects");
    } catch {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-[#0f0f12] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-red-400 dark:border-red-600 focus:ring-red-500/20"
        : "border-gray-200 dark:border-gray-700 focus:ring-gray-900/10 dark:focus:ring-white/10"
    }`;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
      <div className="max-w-sm w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800 rounded-2xl p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Welcome!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tell us a bit about yourself and your company to get started.
          </p>
        </div>

        {generalError && (
          <div className="rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400 mb-4">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Jane"
                  {...register("firstName", {
                    required: "Required",
                  })}
                  className={inputClass(!!errors.firstName)}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Smith"
                  {...register("lastName", {
                    required: "Required",
                  })}
                  className={inputClass(!!errors.lastName)}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

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
                className={inputClass(!!errors.companyName)}
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
                className={inputClass(!!errors.zipCode)}
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
