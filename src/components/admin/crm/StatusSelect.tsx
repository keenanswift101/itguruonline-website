"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CRM_STATUSES, STATUS_LABELS, encodeCrmId } from "@/lib/crm-types";
import type { CrmRecordType } from "@/lib/crm-types";

interface StatusSelectProps {
  recordType: CrmRecordType;
  recordId: number;
  current: string;
}

export function StatusSelect({ recordType, recordId, current }: StatusSelectProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value;
    setPending(true);
    try {
      await fetch(`/api/admin/crm/${encodeCrmId(recordType, recordId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, recordType }),
      });
      router.refresh();
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
        className="rounded-lg border border-(--border-color) bg-(--bg-primary) text-(--text-primary) px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {CRM_STATUSES.map((s) => (
          <option key={s} value={s}>
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
