"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QuotationStatusActionsProps {
  id: number;
  status: string;
  convertedInvoiceId: number | null;
}

export default function QuotationStatusActions({ id, status, convertedInvoiceId }: QuotationStatusActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function patch(target: string) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/quotations/${id}/status`, {
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

      if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        if ((body as { error?: string }).error === "no_client_email") {
          setError("This quotation has no client email. Add a client email (edit the draft above) before marking it Sent.");
          return;
        }
      }

      setError("An unexpected error occurred. Please try again.");
    } catch {
      setError("Unable to update the quotation. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/quotations/${id}/resend`, { method: "POST" });
      if (res.ok) {
        router.refresh();
        return;
      }
      if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        if ((body as { error?: string }).error === "no_client_email") {
          setError("This quotation has no client email to resend to.");
          return;
        }
      }
      setError("Unable to resend the quotation. Please try again.");
    } catch {
      setError("Unable to resend the quotation. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function del() {
    if (pending) return;
    if (!window.confirm("Delete this draft quotation? This cannot be undone.")) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/quotations/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/quotations");
        return;
      }
      setError("Unable to delete this quotation. Please try again.");
    } catch {
      setError("Unable to delete this quotation. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function convert() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/quotations/${id}/convert`, { method: "POST" });

      if (res.status === 201) {
        const body = await res.json().catch(() => ({}));
        router.push(`/admin/invoices/${(body as { id: number }).id}`);
        return;
      }

      if (res.status === 409) {
        setError("This quotation has already been converted.");
        router.refresh();
        return;
      }

      setError("Unable to convert this quotation. Please try again.");
    } catch {
      setError("Unable to convert this quotation. Please check your connection and try again.");
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
              onClick={() => patch("accepted")}
              disabled={pending}
              className="btn-metallic text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Mark Accepted
            </button>
            <button
              type="button"
              onClick={() => patch("declined")}
              disabled={pending}
              className="btn-glass text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Mark Declined
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={pending}
              className="btn-glass text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Resend
            </button>
            <button
              type="button"
              onClick={() => patch("draft")}
              disabled={pending}
              className="btn-glass text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Revert to Draft
            </button>
          </>
        )}

        {status === "declined" && (
          <button
            type="button"
            onClick={() => patch("sent")}
            disabled={pending}
            className="btn-glass text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Mark Sent
          </button>
        )}

        {status === "accepted" &&
          (convertedInvoiceId == null ? (
            <button
              type="button"
              onClick={convert}
              disabled={pending}
              className="btn-metallic text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Convert to Invoice
            </button>
          ) : (
            <Link href={`/admin/invoices/${convertedInvoiceId}`} className="btn-glass text-sm px-4 py-2 rounded-lg">
              View Invoice
            </Link>
          ))}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
