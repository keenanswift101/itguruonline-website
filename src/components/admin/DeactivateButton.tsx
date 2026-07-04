"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeactivateButtonProps {
  scheduleId: number;
}

export function DeactivateButton({ scheduleId }: DeactivateButtonProps) {
  const router = useRouter();
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
        router.refresh();
      }
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
      {pending ? "Deactivating…" : "Deactivate"}
    </button>
  );
}
