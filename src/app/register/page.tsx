import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { RegistrationWizard } from "@/components/forms/RegistrationWizard";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Client Registration",
  description:
    "Register for IT-Guru Online services — domain registration, web hosting, email hosting, and IT support. Complete our simple online application.",
};

export default function RegisterPage() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" aria-hidden="true" priority />
        <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-hidden="true" />
      </div>

      {/* Hero banner */}
      <section className="relative overflow-hidden py-10 sm:py-14" aria-label="Registration hero">
        <div className="flex justify-center mb-8">
          <Image
            src="/FullLogo_Transparent.png"
            alt="IT-Guru Online"
            width={360}
            height={120}
            priority
            className="h-20 sm:h-24 w-auto saturate-200 contrast-125"
          />
        </div>
        <Reveal className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-400">~/register</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Client Registration</h1>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-primary-500" />
          <p className="mt-4 text-slate-300">
            Complete the form below to apply for IT-Guru Online services.
            We'll be in touch within 1 business day.
          </p>
        </Reveal>
      </section>

      {/* Form content */}
      <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal delayMs={80} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 sm:p-8 shadow-sm">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">Loading form…</div>}>
            <RegistrationWizard />
          </Suspense>
        </Reveal>

        {/* POPIA notice */}
        <Reveal delayMs={160} className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          <p>
            Your personal information is protected under the{" "}
            <strong>Protection of Personal Information Act (POPIA)</strong>.
            We will never share your details with third parties without your consent.
            View our{" "}
            <a href="/privacy" className="text-primary-700 underline hover:no-underline">
              Privacy Policy
            </a>.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
