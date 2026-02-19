"use client";

import React, { useState } from "react";
import { Button, Card, Spinner } from "flowbite-react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

// --- Constants ---

const TRADES = [
  "General Contractor",
  "Electrician",
  "Plumber",
  "HVAC",
  "Carpenter",
  "Roofer",
  "Painter",
  "Landscaper",
  "Mason",
  "Other",
] as const;

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

// --- Shared input class ---

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:border-blue-400 dark:placeholder-slate-400";

const selectClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100";

// --- Step 1: Contact Info ---

function Step1({
  fullName, onFullName,
  companyName, onCompanyName,
  email, onEmail,
  phone, onPhone,
  zip, onZip,
  city, onCity,
  state, onState,
  onNext,
}: {
  fullName: string; onFullName: (v: string) => void;
  companyName: string; onCompanyName: (v: string) => void;
  email: string; onEmail: (v: string) => void;
  phone: string; onPhone: (v: string) => void;
  zip: string; onZip: (v: string) => void;
  city: string; onCity: (v: string) => void;
  state: string; onState: (v: string) => void;
  onNext: () => void;
}) {
  const canAdvance =
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    zip.length === 5;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Contact Information</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Step 1 of 2</p>
      </div>

      <input
        type="text"
        className={inputClass}
        placeholder="Full name *"
        value={fullName}
        onChange={(e) => onFullName(e.target.value)}
      />
      <input
        type="text"
        className={inputClass}
        placeholder="Company name (optional)"
        value={companyName}
        onChange={(e) => onCompanyName(e.target.value)}
      />
      <input
        type="email"
        className={inputClass}
        placeholder="Email address *"
        value={email}
        onChange={(e) => onEmail(e.target.value)}
      />
      <input
        type="tel"
        className={inputClass}
        placeholder="Phone number *"
        value={phone}
        onChange={(e) => onPhone(e.target.value)}
      />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={5}
        className={inputClass}
        placeholder="ZIP code *"
        value={zip}
        onChange={(e) => onZip(e.target.value.replace(/\D/g, ""))}
      />
      <div className="flex gap-3">
        <input
          type="text"
          className={inputClass}
          placeholder="City"
          value={city}
          onChange={(e) => onCity(e.target.value)}
        />
        <input
          type="text"
          className={inputClass}
          placeholder="State"
          value={state}
          onChange={(e) => onState(e.target.value)}
        />
      </div>

      <Button color="blue" onClick={onNext} disabled={!canAdvance} className="w-full mt-2">
        Next
      </Button>
    </div>
  );
}

// --- Step 2: Trade & License ---

function Step2({
  specialty, onSpecialty,
  licenseNumber, onLicenseNumber,
  licenseState, onLicenseState,
  licenseExpiry, onLicenseExpiry,
  onBack,
  onSubmit,
  submitting,
}: {
  specialty: string; onSpecialty: (v: string) => void;
  licenseNumber: string; onLicenseNumber: (v: string) => void;
  licenseState: string; onLicenseState: (v: string) => void;
  licenseExpiry: string; onLicenseExpiry: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const canSubmit = specialty !== "" && licenseNumber.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Trade &amp; License</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Step 2 of 2</p>
      </div>

      <select
        className={selectClass}
        value={specialty}
        onChange={(e) => onSpecialty(e.target.value)}
      >
        <option value="">Select your specialty / trade *</option>
        {TRADES.map((trade) => (
          <option key={trade} value={trade}>{trade}</option>
        ))}
      </select>

      <input
        type="text"
        className={inputClass}
        placeholder="License number *"
        value={licenseNumber}
        onChange={(e) => onLicenseNumber(e.target.value)}
      />

      <select
        className={selectClass}
        value={licenseState}
        onChange={(e) => onLicenseState(e.target.value)}
      >
        <option value="">License state (optional)</option>
        {US_STATES.map(([abbr, name]) => (
          <option key={abbr} value={abbr}>{name}</option>
        ))}
      </select>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 dark:text-slate-400">License expiry (optional)</label>
        <input
          type="date"
          className={inputClass}
          value={licenseExpiry}
          onChange={(e) => onLicenseExpiry(e.target.value)}
        />
      </div>

      <div className="flex gap-3 mt-2">
        <Button color="light" onClick={onBack} className="flex-1" disabled={submitting}>
          Back
        </Button>
        <Button color="blue" onClick={onSubmit} disabled={!canSubmit || submitting} className="flex-1">
          {submitting ? <Spinner size="sm" className="mr-2" /> : null}
          {submitting ? "Submitting…" : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}

// --- Confirmation ---

function ConfirmationView() {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400" />
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Application Submitted!</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 max-w-sm">
          Thanks for applying. Our team will review your credentials and reach out once you&apos;ve been vetted. This usually takes 1–3 business days.
        </p>
      </div>
    </div>
  );
}

// --- Main page ---

export default function JoinPage() {
  const [step, setStep] = useState<1 | 2 | "done">(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Step 2 fields
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      const payload: Record<string, string> = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        zip: zip.trim(),
        specialty,
        license_number: licenseNumber.trim(),
      };
      if (companyName.trim()) payload.company_name = companyName.trim();
      if (city.trim()) payload.city = city.trim();
      if (state.trim()) payload.state = state.trim();
      if (licenseState) payload.license_state = licenseState;
      if (licenseExpiry) payload.license_expiry = licenseExpiry;

      const res = await fetch("/api/contractors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center w-full py-8 px-4">
      <Card className="bg-blue-50 dark:bg-slate-800 w-full max-w-lg p-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Join as a Contractor</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Get matched with homeowners looking for your trade.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400 mb-2">
            {error}
          </div>
        )}

        {step === 1 && (
          <Step1
            fullName={fullName} onFullName={setFullName}
            companyName={companyName} onCompanyName={setCompanyName}
            email={email} onEmail={setEmail}
            phone={phone} onPhone={setPhone}
            zip={zip} onZip={setZip}
            city={city} onCity={setCity}
            state={state} onState={setState}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2
            specialty={specialty} onSpecialty={setSpecialty}
            licenseNumber={licenseNumber} onLicenseNumber={setLicenseNumber}
            licenseState={licenseState} onLicenseState={setLicenseState}
            licenseExpiry={licenseExpiry} onLicenseExpiry={setLicenseExpiry}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}

        {step === "done" && <ConfirmationView />}
      </Card>
    </div>
  );
}
