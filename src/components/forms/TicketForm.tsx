"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ClientPicker } from "@/components/forms/ClientPicker";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import type { ClientPickerOption } from "@/lib/client-types";
import type { TicketPriority } from "@/lib/ticket-types";

interface TicketFormProps {
  clients: ClientPickerOption[];
}

interface FieldErrors {
  clientId?: string;
  subject?: string;
  description?: string;
  priority?: string;
}

export default function TicketForm({ clients }: TicketFormProps) {
  const id = useId();
  const router = useRouter();
  const toast = useToast();

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  function handleClientSelect(client: ClientPickerOption | null) {
    setSelectedClientId(client ? client.id : null);
    if (errors.clientId) {
      setErrors((prev) => ({ ...prev, clientId: undefined }));
    }
  }

  function handleSubjectChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSubject(e.target.value);
    if (errors.subject) {
      setErrors((prev) => ({ ...prev, subject: undefined }));
    }
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (selectedClientId == null) errs.clientId = "Select a client.";
    if (!subject.trim()) errs.subject = "Subject is required.";
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
      clientId: selectedClientId,
      subject,
      description,
      priority,
    });

    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        router.push(`/admin/tickets/${(data as { id: number }).id}`);
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
        toast.error((data as { error?: string }).error ?? "Please fix the highlighted fields.");
        return;
      }

      setStatus("error");
      const message = (data as { error?: string }).error ?? "An unexpected error occurred. Please try again.";
      setServerMessage(message);
      toast.error(message);
    } catch {
      const message = "Unable to create the ticket. Please check your connection and try again.";
      setStatus("error");
      setServerMessage(message);
      toast.error(message);
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

      <div>
        <label className="block text-sm font-medium text-(--text-primary) mb-1.5">
          Client <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <ClientPicker clients={clients} selectedClientId={selectedClientId} onSelect={handleClientSelect} />
        {errors.clientId && (
          <p role="alert" className="mt-1 text-xs text-red-400">
            {errors.clientId}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-subject`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
          Subject <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id={`${id}-subject`}
          name="subject"
          type="text"
          maxLength={200}
          value={subject}
          onChange={handleSubjectChange}
          aria-describedby={errors.subject ? `${id}-subject-error` : undefined}
          aria-invalid={!!errors.subject}
          className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors ${
            errors.subject ? "border-red-500 focus:ring-red-500" : "border-(--border-color)"
          }`}
        />
        {errors.subject && (
          <p id={`${id}-subject-error`} role="alert" className="mt-1 text-xs text-red-400">
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-description`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
          Description <span className="text-(--text-secondary) font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id={`${id}-description`}
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-(--border-color) px-3 py-2.5 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] resize-y transition-colors"
        />
      </div>

      <div>
        <label htmlFor={`${id}-priority`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
          Priority
        </label>
        <select
          id={`${id}-priority`}
          name="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority)}
          style={{ colorScheme: "dark" }}
          className="h-10 w-full rounded-lg border border-(--border-color) px-3 text-sm bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors scheme-dark"
        >
          <option value="low" className="bg-(--bg-primary) text-(--text-primary)">Low</option>
          <option value="medium" className="bg-(--bg-primary) text-(--text-primary)">Medium</option>
          <option value="high" className="bg-(--bg-primary) text-(--text-primary)">High</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-metallic text-sm px-6 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Creating…
          </span>
        ) : (
          "Create Ticket"
        )}
      </button>
    </form>
  );
}
