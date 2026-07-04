"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ClientFormInitial {
  name: string;
  email: string;
  phone: string;
  company: string;
  physicalAddress: string;
  postalAddress: string;
}

interface ClientFormProps {
  /** When set, the form edits an existing client (PUT) instead of creating one (POST). */
  clientId?: number;
  /** Prefill values for edit mode. */
  initial?: ClientFormInitial;
}

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  physicalAddress?: string;
  postalAddress?: string;
}

const emptyFields: ClientFormInitial = {
  name: "",
  email: "",
  phone: "",
  company: "",
  physicalAddress: "",
  postalAddress: "",
};

export default function ClientForm({ clientId, initial }: ClientFormProps) {
  const id = useId();
  const router = useRouter();

  const [fields, setFields] = useState<ClientFormInitial>(initial ?? emptyFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "saved">("idle");
  const [serverMessage, setServerMessage] = useState("");

  function handleFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (status === "saved") setStatus("idle");
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!fields.name.trim()) errs.name = "Name is required.";
    if (!fields.email.trim()) errs.email = "Email is required.";
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStatus("submitting");
    setErrors({});
    setServerMessage("");

    const body = JSON.stringify({
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      company: fields.company,
      physicalAddress: fields.physicalAddress,
      postalAddress: fields.postalAddress,
    });

    try {
      const res = clientId ? await fetch(`/api/admin/clients/${clientId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body,
          })
        : await fetch("/api/admin/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        router.push(`/admin/clients/${(data as { id: number }).id}`);
        return;
      }

      if (res.ok && clientId) {
        // Edit mode: stay on the page, revalidate server data, show a saved indicator.
        setStatus("saved");
        router.refresh();
        return;
      }

      if (res.status === 422) {
        const fieldErrs = (data as { fields?: Record<string, string[]> }).fields ?? {};
        const mapped: FieldErrors = {};
        for (const [key, msgs] of Object.entries(fieldErrs)) {
          if (msgs?.length) mapped[key as keyof FieldErrors] = msgs[0];
        }
        setErrors(mapped);
        setStatus("error");
        setServerMessage((data as { error?: string }).error ?? "Please fix the highlighted fields.");
        return;
      }

      setStatus("error");
      setServerMessage((data as { error?: string }).error ?? "An unexpected error occurred. Please try again.");
    } catch {
      setStatus("error");
      setServerMessage(
        clientId
          ? "Unable to save changes. Please check your connection and try again."
          : "Unable to create the client. Please check your connection and try again."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={status === "submitting"} className="space-y-6">
      {status === "error" && serverMessage && (
        <div
          role="alert"
          className="rounded-lg bg-red-950/30 border border-red-800 px-4 py-3 text-sm text-red-300"
        >
          {serverMessage}
        </div>
      )}

      {status === "saved" && (
        <div className="rounded-lg bg-green-950/30 border border-green-800 px-4 py-3 text-sm text-green-300">
          Saved.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
            Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            value={fields.name}
            onChange={handleFieldChange}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
            aria-invalid={!!errors.name}
            className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors ${
              errors.name ? "border-red-500 focus:ring-red-500" : "border-(--border-color)"
            }`}
          />
          {errors.name && (
            <p id={`${id}-name-error`} role="alert" className="mt-1 text-xs text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-email`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
            Email <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            value={fields.email}
            onChange={handleFieldChange}
            aria-describedby={errors.email ? `${id}-email-error` : undefined}
            aria-invalid={!!errors.email}
            className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors ${
              errors.email ? "border-red-500 focus:ring-red-500" : "border-(--border-color)"
            }`}
          />
          {errors.email && (
            <p id={`${id}-email-error`} role="alert" className="mt-1 text-xs text-red-400">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-phone`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
            Phone <span className="text-(--text-secondary) font-normal text-xs">(optional)</span>
          </label>
          <input
            id={`${id}-phone`}
            name="phone"
            type="text"
            value={fields.phone}
            onChange={handleFieldChange}
            className="h-10 w-full rounded-lg border border-(--border-color) px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors"
          />
        </div>

        <div>
          <label htmlFor={`${id}-company`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
            Company <span className="text-(--text-secondary) font-normal text-xs">(optional)</span>
          </label>
          <input
            id={`${id}-company`}
            name="company"
            type="text"
            value={fields.company}
            onChange={handleFieldChange}
            className="h-10 w-full rounded-lg border border-(--border-color) px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-physicalAddress`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
          Physical Address <span className="text-(--text-secondary) font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id={`${id}-physicalAddress`}
          name="physicalAddress"
          rows={3}
          value={fields.physicalAddress}
          onChange={handleFieldChange}
          className="w-full rounded-lg border border-(--border-color) px-3 py-2.5 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] resize-y transition-colors"
        />
      </div>

      <div>
        <label htmlFor={`${id}-postalAddress`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
          Postal Address <span className="text-(--text-secondary) font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id={`${id}-postalAddress`}
          name="postalAddress"
          rows={3}
          value={fields.postalAddress}
          onChange={handleFieldChange}
          className="w-full rounded-lg border border-(--border-color) px-3 py-2.5 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] resize-y transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-metallic text-sm px-6 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {clientId
          ? status === "submitting"
            ? "Saving…"
            : "Save Changes"
          : status === "submitting"
            ? "Creating…"
            : "Create Client"}
      </button>
    </form>
  );
}
