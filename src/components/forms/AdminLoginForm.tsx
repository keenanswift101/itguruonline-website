"use client";

import { useState, useId, type FormEvent } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Status = "idle" | "submitting" | "error:credentials" | "error:lockout" | "error:generic";

export default function AdminLoginForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        window.location.href = "/admin/dashboard";
        return;
      }

      if (res.status === 401) {
        setStatus("error:credentials");
      } else if (res.status === 429 || res.status === 423) {
        setStatus("error:lockout");
      } else {
        setStatus("error:generic");
      }
    } catch {
      setStatus("error:generic");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-password`} className="text-sm font-medium text-(--text-secondary)">
          Password
        </label>
        <PasswordInput
          id={`${id}-password`}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {status === "error:credentials" && (
        <p role="alert" className="text-red-400 text-sm">
          Invalid email or password.
        </p>
      )}
      {status === "error:lockout" && (
        <p role="alert" className="text-amber-400 text-sm">
          Too many attempts. Please try again in a few minutes.
        </p>
      )}
      {status === "error:generic" && (
        <p role="alert" className="text-red-400 text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      <button type="submit" className="btn-metallic w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <a
        href="/admin/forgot-password"
        className="text-center text-xs text-(--text-secondary) hover:text-(--text-primary) transition-colors"
      >
        Forgot password?
      </a>
    </form>
  );
}
