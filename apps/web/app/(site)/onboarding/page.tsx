"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { Button, Card, Label, TextInput, Spinner } from "flowbite-react";

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
            firstName: (user.given_name as string) || user.name?.split(" ")[0] || "",
            lastName: (user.family_name as string) || user.name?.split(" ").slice(1).join(" ") || "",
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Welcome{user?.given_name ? `, ${user.given_name}` : ""}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
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
              <Label htmlFor="companyName" value="Company name" />
              <TextInput
                id="companyName"
                type="text"
                placeholder="Acme Contracting"
                {...register("companyName", {
                  required: "Company name is required",
                })}
                color={errors.companyName ? "failure" : undefined}
                helperText={
                  errors.companyName ? (
                    <span className="text-red-600 text-xs">
                      {errors.companyName.message}
                    </span>
                  ) : undefined
                }
              />
            </div>

            <div>
              <Label htmlFor="zipCode" value="ZIP code" />
              <TextInput
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
                color={errors.zipCode ? "failure" : undefined}
                helperText={
                  errors.zipCode ? (
                    <span className="text-red-600 text-xs">
                      {errors.zipCode.message}
                    </span>
                  ) : undefined
                }
              />
            </div>

            <Button
              color="blue"
              type="submit"
              disabled={submitting}
              className="w-full mt-2"
            >
              {submitting ? "Setting up..." : "Get Started"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
