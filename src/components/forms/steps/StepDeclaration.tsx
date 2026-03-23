"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { StepDData } from "@/lib/registration-types";
import { validateStepD } from "@/lib/registration-validators";

interface StepDProps {
  data: StepDData;
  onSubmit: (data: StepDData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function StepDeclaration({ data, onSubmit, onBack, isSubmitting }: StepDProps) {
  const [fields, setFields] = useState<StepDData>({
    ...data,
    signatureDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFields((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  }

  function handleSubmit() {
    const errs = validateStepD(fields);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(fields);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Section D — Declaration</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Please read and accept the terms, then provide your digital signature.
        </p>
      </div>

      {/* Terms box */}
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 max-h-48 overflow-y-auto text-sm leading-relaxed text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--text-primary)] mb-2">Terms and Conditions</p>
        <p className="mb-2">
          By submitting this application, the applicant acknowledges and agrees to the following:
        </p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>All information provided in this application is true and accurate.</li>
          <li>IT-Guru Online may verify the information provided against official sources.</li>
          <li>Domain registration and hosting services are subject to availability and payment.</li>
          <li>Service activation is contingent on receipt of payment and completion of verification.</li>
          <li>The applicant authorises IT-Guru Online to configure DNS settings on their behalf unless custom nameservers are specified.</li>
          <li>Personal information is collected and processed in accordance with the Protection of Personal Information Act (POPIA) 4 of 2013.</li>
          <li>IT-Guru Online reserves the right to suspend or terminate services for breach of these terms.</li>
          <li>All prices are subject to change with 30 days notice.</li>
        </ol>
        <p className="mt-3">
          For full terms and conditions, visit{" "}
          <Link href="/terms" className="text-primary-700 underline hover:no-underline">
            it-guru.online/terms
          </Link>.
        </p>
      </div>

      {/* Terms acceptance */}
      <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
        fields.termsAccepted
          ? "border-primary-300 bg-primary-50/40 dark:border-primary-700/50 dark:bg-primary-900/10"
          : errors.termsAccepted
          ? "border-error bg-red-50/30 dark:bg-red-900/10"
          : "border-[var(--border-color)] hover:bg-[var(--bg-surface)]"
      }`}>
        <input
          type="checkbox" name="termsAccepted"
          className="mt-0.5 h-4 w-4 rounded accent-primary-700 cursor-pointer"
          checked={fields.termsAccepted}
          onChange={handleChange}
        />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            I accept the Terms and Conditions <span className="text-error">*</span>
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            I confirm that I have read, understood, and agree to the terms above.
          </p>
        </div>
      </label>
      {errors.termsAccepted && <p className="-mt-4 text-xs text-error">{errors.termsAccepted}</p>}

      {/* Digital signature */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="signature">
          Digital Signature — Type Your Full Name <span className="text-error">*</span>
        </label>
        <input
          id="signature" name="signature" type="text" autoComplete="name"
          placeholder="e.g. John Smith"
          value={fields.signature} onChange={handleChange}
          className={`h-12 w-full rounded-lg border px-4 text-lg italic bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-serif ${errors.signature ? "ring-2 ring-error border-error" : ""}`}
          style={{ fontFamily: "'Georgia', serif" }}
        />
        {errors.signature
          ? <p className="mt-1 text-xs text-error">{errors.signature}</p>
          : <p className="mt-1 text-xs text-[var(--text-secondary)]">Typing your full name serves as your digital signature for this application.</p>
        }
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="signatureDate">
          Date
        </label>
        <input
          id="signatureDate" name="signatureDate" type="date"
          value={fields.signatureDate} readOnly
          className="h-10 w-48 rounded-lg border px-3 bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-color)] cursor-not-allowed opacity-75"
        />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Date is set automatically to today.</p>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>← Back</Button>
        <Button onClick={handleSubmit} size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Submitting…
            </span>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
    </div>
  );
}
