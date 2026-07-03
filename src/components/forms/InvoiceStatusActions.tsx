"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InvoiceStatusActionsProps {
  id: number;
  status: string;
}

export default function InvoiceStatusActions({ id, status }: InvoiceStatusActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function patch(target: string) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });

      if (res.ok) {
        router.refresh();
        return;
      }

      if (res.status === 409) {
        setError("Invalid transition.");
        return;
      }

      setError("An unexpected error occurred. Please try again.");
    } catch {
      setError("Unable to update the invoice. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function del() {
    if (pending) return;
    if (!window.confirm("Delete this draft invoice? This cannot be undone.")) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/invoices");
        return;
      }
      setError("Unable to delete this invoice. Please try again.");
    } catch {
      setError("Unable to delete this invoice. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {status === "draft" && (
          <>
            <button
              type="button"
              onClick={() => patch("sent")}
              disabled={pending}
              className="btn-metallic text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Mark Sent
            </button>
            <button
              type="button"
              onClick={del}
              disabled={pending}
              className="btn-glass text-sm px-4 py-2 rounded-lg text-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </>
        )}

        {status === "sent" && (
          <>
            <button
              type="button"
              onClick={() => patch("paid")}
              disabled={pending}
              className="btn-metallic text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Mark Paid
            </button>
            <button
              type="button"
              onClick={() => patch("draft")}
              disabled={pending}
              className="btn-glass text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Unpublish
            </button>
          </>
        )}

        {status === "paid" && (
          <button
            type="button"
            onClick={() => patch("sent")}
            disabled={pending}
            className="btn-glass text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Undo Paid
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
