"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_TRANSITIONS, STATUS_BADGE, type TicketStatus } from "@/lib/ticket-status";
import { useToast } from "@/components/ui/Toast";

interface TicketStatusSelectProps {
  ticketId: number;
  current: TicketStatus;
}

export function TicketStatusSelect({ ticketId, current }: TicketStatusSelectProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  // Current status + its allowed targets (deduped) — the owner can't pick an invalid transition.
  const options = Array.from(new Set<TicketStatus>([current, ...ALLOWED_TRANSITIONS[current]]));

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value;
    if (status === current) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Couldn't update the status. Please try again.");
        return;
      }
      toast.success("Status updated.");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="ticket-status-select" className="text-sm text-(--text-secondary)">
        Status:
      </label>
      <select
        id="ticket-status-select"
        defaultValue={current}
        disabled={pending}
        onChange={handleChange}
        className="rounded-lg border border-(--border-color) bg-(--bg-primary) text-(--text-primary) px-3 py-1.5 text-sm scheme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {options.map((s) => (
          <option key={s} value={s} className="bg-(--bg-primary) text-(--text-primary)">
            {STATUS_BADGE[s]?.label ?? s}
          </option>
        ))}
      </select>
      {pending && (
        <span className="text-xs text-(--text-secondary)" aria-live="polite">
          Saving…
        </span>
      )}
    </div>
  );
}
