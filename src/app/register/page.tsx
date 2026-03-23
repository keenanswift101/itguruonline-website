import type { Metadata } from "next";
import { Suspense } from "react";
import { RegistrationWizard } from "@/components/forms/RegistrationWizard";

export const metadata: Metadata = {
  title: "Client Registration",
  description:
    "Register for IT-Guru Online services — domain registration, web hosting, email hosting, and IT support. Complete our simple online application.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Client Registration
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Complete the form below to apply for IT-Guru Online services.
            We'll be in touch within 1 business day.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 sm:p-8 shadow-sm">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">Loading form…</div>}>
            <RegistrationWizard />
          </Suspense>
        </div>

        {/* POPIA notice */}
        <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          Your personal information is protected under the{" "}
          <strong>Protection of Personal Information Act (POPIA)</strong>.
          We will never share your details with third parties without your consent.
          View our{" "}
          <a href="/privacy" className="text-primary-700 underline hover:no-underline">
            Privacy Policy
          </a>.
        </p>
      </div>
    </div>
  );
}
