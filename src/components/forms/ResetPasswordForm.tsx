"use client";

import { useState, useId, type FormEvent } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Status = "idle" | "submitting" | "success" | "error:invalid" | "error:mismatch" | "error:generic";

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      setStatus("error:mismatch");
      return;
    }
    if (password.length < 8) {
      setStatus("error:generic");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          window.location.href = "/admin/login?reset=1";
        }, 1500);
        return;
      }

      if (res.status === 400) {
        setStatus("error:invalid");
      } else {
        setStatus("error:generic");
      }
    } catch {
      setStatus("error:generic");
    }
  }

  const isSubmitting = status === "submitting";

  if (status === "success") {
    return (
      <p className="text-sm text-green-400 text-center">
        Password updated. Redirecting to login…
      </p>
    );
  }

  if (!token) {
    return (
      <p className="text-sm text-amber-400 text-center">
        This reset link is invalid or has expired. Please request a new one.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-password`} className="text-sm font-medium text-(--text-secondary)">
          New password
        </label>
        <PasswordInput
          id={`${id}-password`}
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-confirm`} className="text-sm font-medium text-(--text-secondary)">
          Confirm new password
        </label>
        <PasswordInput
          id={`${id}-confirm`}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {status === "error:mismatch" && (
        <p role="alert" className="text-red-400 text-sm">
          Passwords do not match.
        </p>
      )}
      {status === "error:invalid" && (
        <p role="alert" className="text-red-400 text-sm">
          This reset link is invalid or has expired.
        </p>
      )}
      {status === "error:generic" && (
        <p role="alert" className="text-red-400 text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      <button type="submit" className="btn-metallic w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
