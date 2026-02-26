"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { Button, Card, Label, TextInput } from "flowbite-react";

interface OnboardingForm {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  zipCode: string;
}

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    trigger,
  } = useForm<OnboardingForm>();

  useEffect(() => {
    if (user) {
      setValue("firstName", (user.given_name as string) || "");
      setValue("lastName", (user.family_name as string) || "");
      setValue("email", (user.email as string) || "");
    }
  }, [user, setValue]);

  async function handleNext() {
    const valid = await trigger(["firstName", "lastName", "email"]);
    if (valid) setStep(2);
  }

  const onSubmit = async (data: OnboardingForm) => {
    setSubmitting(true);
    setGeneralError(null);
    try {
      const res = await fetch("/api/proxy/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
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
              setError(field as keyof OnboardingForm, { message });
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Set up your account
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Step {step} of 2
          </p>
        </div>

        {generalError && (
          <div className="rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400 mb-4">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="firstName" value="First name" />
                <TextInput
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                  color={errors.firstName ? "failure" : undefined}
                  helperText={
                    errors.firstName ? (
                      <span className="text-red-600 text-xs">
                        {errors.firstName.message}
                      </span>
                    ) : undefined
                  }
                />
              </div>

              <div>
                <Label htmlFor="lastName" value="Last name" />
                <TextInput
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                  color={errors.lastName ? "failure" : undefined}
                  helperText={
                    errors.lastName ? (
                      <span className="text-red-600 text-xs">
                        {errors.lastName.message}
                      </span>
                    ) : undefined
                  }
                />
              </div>

              <div>
                <Label htmlFor="email" value="Email" />
                <TextInput
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  color={errors.email ? "failure" : undefined}
                  helperText={
                    errors.email ? (
                      <span className="text-red-600 text-xs">
                        {errors.email.message}
                      </span>
                    ) : undefined
                  }
                />
              </div>

              <Button
                color="blue"
                type="button"
                onClick={handleNext}
                className="w-full mt-2"
              >
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
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

              <div className="flex gap-3 mt-2">
                <Button
                  color="gray"
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  color="blue"
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Saving..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
