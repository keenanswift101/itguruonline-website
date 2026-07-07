"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CRM_STATUSES, STATUS_LABELS, encodeCrmId } from "@/lib/crm-types";
import type { CrmRecordType } from "@/lib/crm-types";
import { useToast } from "@/components/ui/Toast";

interface StatusSelectProps {
  recordType: CrmRecordType;
  recordId: number;
  current: string;
}

export function StatusSelect({ recordType, recordId, current }: StatusSelectProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/crm/${encodeCrmId(recordType, recordId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, recordType }),
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
      <label htmlFor="status-select" className="text-sm text-(--text-secondary)">
        Status:
      </label>
      <select
        id="status-select"
        defaultValue={current}
        disabled={pending}
        onChange={handleChange}
        className="rounded-lg border border-(--border-color) bg-(--bg-primary) text-(--text-primary) px-3 py-1.5 text-sm scheme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {CRM_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-(--bg-primary) text-(--text-primary)">
            {STATUS_LABELS[s]}
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
