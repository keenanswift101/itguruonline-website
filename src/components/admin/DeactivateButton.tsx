"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

interface DeactivateButtonProps {
  scheduleId: number;
}

export function DeactivateButton({ scheduleId }: DeactivateButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/billing-schedules/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (res.ok) {
        toast.success("Billing schedule deactivated.");
        router.refresh();
      } else {
        toast.error("Couldn't deactivate the schedule. Please try again.");
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
      onClick={handleClick}
      disabled={pending}
      className="btn-glass text-xs px-3 py-1 disabled:opacity-50"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner className="w-3 h-3" /> Deactivating…
        </span>
      ) : (
        "Deactivate"
      )}
    </button>
  );
}
