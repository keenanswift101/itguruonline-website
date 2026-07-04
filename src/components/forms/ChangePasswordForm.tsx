"use client";

import { useState, useId, type FormEvent } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Status = "idle" | "submitting" | "success" | "error:current" | "error:mismatch" | "error:generic";

export default function ChangePasswordForm() {
  const id = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (newPassword !== confirm) {
      setStatus("error:mismatch");
      return;
    }
    if (newPassword.length < 8) {
      setStatus("error:generic");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setStatus("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirm("");
        return;
      }

      if (res.status === 400) {
        setStatus("error:current");
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
        <label htmlFor={`${id}-current`} className="text-sm font-medium text-(--text-secondary)">
          Current password
        </label>
        <PasswordInput
          id={`${id}-current`}
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-new`} className="text-sm font-medium text-(--text-secondary)">
          New password
        </label>
        <PasswordInput
          id={`${id}-new`}
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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

      {status === "success" && (
        <p role="status" className="text-green-400 text-sm">
          Password updated.
        </p>
      )}
      {status === "error:current" && (
        <p role="alert" className="text-red-400 text-sm">
          Current password is incorrect.
        </p>
      )}
      {status === "error:mismatch" && (
        <p role="alert" className="text-red-400 text-sm">
          New passwords do not match.
        </p>
      )}
      {status === "error:generic" && (
        <p role="alert" className="text-red-400 text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      <button type="submit" className="btn-metallic w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
