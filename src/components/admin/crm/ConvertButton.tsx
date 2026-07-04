"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeCrmId } from "@/lib/crm-types";
import type { CrmRecordType } from "@/lib/crm-types";

interface ConvertButtonProps {
  recordType: CrmRecordType;
  recordId: number;
  convertedClientId: number | null;
}

export function ConvertButton({ recordType, recordId, convertedClientId }: ConvertButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (convertedClientId) {
    return (
      <a
        href={`/admin/clients/${convertedClientId}`}
        className="btn-glass text-sm px-4 py-2 rounded-lg inline-block"
      >
        View Client
      </a>
    );
  }

  async function handleConvert() {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/crm/${encodeCrmId(recordType, recordId)}/convert`, {
        method: "POST",
      });
      if (res.ok) {
        const { id } = await res.json();
        router.push(`/admin/clients/${id}`);
        return;
      }
      if (res.status === 409) {
        setError("Already converted.");
        router.refresh();
      } else {
        setError("Convert failed.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={handleConvert}
        disabled={pending}
        className="btn-metallic text-sm px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {pending ? "Converting…" : "Convert to Client"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
