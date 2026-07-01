"use client";

import { useState, useId, type FormEvent } from "react";

type Status = "idle" | "submitting" | "sent" | "error";

export default function ForgotPasswordForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show the neutral confirmation — no enumeration leakage
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const isSubmitting = status === "submitting";

  if (status === "sent") {
    return (
      <p className="text-sm text-(--text-secondary) text-center leading-relaxed">
        If that account exists, a reset link has been sent.
        <br />
        <span className="text-xs opacity-70">Check your email and follow the link.</span>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-(--text-secondary)">
        Enter your admin email address and we&apos;ll send a reset link.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-email`} className="text-sm font-medium text-(--text-secondary)">
          Email address
        </label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-(--border-color) bg-(--bg-primary) px-3 py-2 text-(--text-primary) text-sm placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin@example.com"
          disabled={isSubmitting}
        />
      </div>

      {status === "error" && (
        <p role="alert" className="text-red-400 text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      <button type="submit" className="btn-metallic w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
