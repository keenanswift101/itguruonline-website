"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeCrmId } from "@/lib/crm-types";
import type { CrmRecordType } from "@/lib/crm-types";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

interface ConvertButtonProps {
  recordType: CrmRecordType;
  recordId: number;
  convertedClientId: number | null;
}

export function ConvertButton({ recordType, recordId, convertedClientId }: ConvertButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

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
    try {
      const res = await fetch(`/api/admin/crm/${encodeCrmId(recordType, recordId)}/convert`, {
        method: "POST",
      });
      if (res.ok) {
        const { id } = await res.json();
        toast.success("Converted to a client.");
        router.push(`/admin/clients/${id}`);
        return;
      }
      if (res.status === 409) {
        toast.error("This record has already been converted to a client.");
        router.refresh();
      } else {
        toast.error("Couldn't convert this record. Please try again.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleConvert}
      disabled={pending}
      className="btn-metallic text-sm px-4 py-2 rounded-lg disabled:opacity-50"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner /> Converting…
        </span>
      ) : (
        "Convert to Client"
      )}
    </button>
  );
}
