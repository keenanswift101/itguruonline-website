"use client";

import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

const SUBJECTS = [
  "General Enquiry",
  "Remote / Online Support",
  "Network Services",
  "Hardware Procurement",
  "Web Hosting & Domains",
  "Web Design",
  "Billing & Account",
  "Other",
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function validateForm(f: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!f.name.trim()) errs.name = "Name is required.";
  else if (f.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
  if (!f.email.trim()) errs.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errs.email = "Enter a valid email address.";
  if (!f.subject.trim()) errs.subject = "Please select a subject.";
  if (!f.message.trim()) errs.message = "Message is required.";
  else if (f.message.trim().length < 10) errs.message = "Message must be at least 10 characters.";
  return errs;
}

export default function ContactForm() {
  const id = useId();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Client-side validation before network call
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStatus("submitting");
    setErrors({});

    try {
      // Submit to Netlify Forms
      const formBody = new URLSearchParams({
        "form-name": "contact",
        ...form,
      });

      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      if (res.ok) {
        setStatus("success");
        setServerMessage("Thank you! Your message has been received. We will respond within one business day.");
        setForm(initialState);
      } else {
        setStatus("error");
        setServerMessage("An unexpected error occurred. Please try again.");
      }
    } catch {
      setStatus("error");
      setServerMessage("Unable to send your message. Please check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">Message Sent!</h3>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">{serverMessage}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-green-700 dark:text-green-300 underline underline-offset-2 hover:no-underline cursor-pointer"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      name="contact"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={status === "submitting"}
      className="space-y-5"
    >
      <input type="hidden" name="form-name" value="contact" />
      {/* Honeypot hidden from screen readers */}
      <p className="hidden" aria-hidden="true">
        <label>Don&apos;t fill this out: <input name="bot-field" /></label>
      </p>
      {status === "error" && (
        <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {serverMessage}
        </div>
      )}

      {/* Name + Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="block text-sm font-medium mb-1.5">
            Full Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Smith"
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
            aria-invalid={!!errors.name}
            className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors ${
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-(--border-color)"
            }`}
          />
          {errors.name && (
            <p id={`${id}-name-error`} role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-email`} className="block text-sm font-medium mb-1.5">
            Email Address <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            aria-describedby={errors.email ? `${id}-email-error` : undefined}
            aria-invalid={!!errors.email}
            className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors ${
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-(--border-color)"
            }`}
          />
          {errors.email && (
            <p id={`${id}-email-error`} role="alert" className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Phone + Subject */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-phone`} className="block text-sm font-medium mb-1.5">
            Phone Number <span className="text-(--text-secondary) font-normal text-xs">(optional)</span>
          </label>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+27 72 962 7608"
            aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
            aria-invalid={!!errors.phone}
            className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors ${
              errors.phone
                ? "border-red-500 focus:ring-red-500"
                : "border-(--border-color)"
            }`}
          />
          {errors.phone && (
            <p id={`${id}-phone-error`} role="alert" className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-subject`} className="block text-sm font-medium mb-1.5">
            Subject <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id={`${id}-subject`}
            name="subject"
            value={form.subject}
            onChange={handleChange}
            aria-describedby={errors.subject ? `${id}-subject-error` : undefined}
            aria-invalid={!!errors.subject}
            className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors appearance-none cursor-pointer ${
              errors.subject
                ? "border-red-500 focus:ring-red-500"
                : "border-(--border-color)"
            } ${!form.subject ? "text-(--text-secondary)" : ""}`}
          >
            <option value="" disabled>Select a subject…</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.subject && (
            <p id={`${id}-subject-error`} role="alert" className="mt-1 text-xs text-red-600">{errors.subject}</p>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor={`${id}-message`} className="block text-sm font-medium mb-1.5">
          Message <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          value={form.message}
          onChange={handleChange}
          placeholder="Describe your IT challenge or what you're looking for…"
          aria-describedby={errors.message ? `${id}-message-error` : undefined}
          aria-invalid={!!errors.message}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 resize-y transition-colors min-h-[120px] ${
            errors.message
              ? "border-red-500 focus:ring-red-500"
              : "border-(--border-color)"
          }`}
        />
        <div className="flex items-start justify-between mt-1">
          {errors.message ? (
            <p id={`${id}-message-error`} role="alert" className="text-xs text-red-600">{errors.message}</p>
          ) : (
            <span />
          )}
          <span className={`text-xs ${form.message.length > 1800 ? "text-amber-500" : "text-(--text-secondary)"}`}>
            {form.message.length}/2000
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="w-full justify-center sm:w-auto"
        size="lg"
      >
        {status === "submitting" ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
            </svg>
            Sending…
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
