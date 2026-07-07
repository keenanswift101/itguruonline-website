"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

interface QuotationStatusActionsProps {
  id: number;
  status: string;
  convertedInvoiceId: number | null;
}

export default function QuotationStatusActions({ id, status, convertedInvoiceId }: QuotationStatusActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(target: string, action: string, successMsg: string) {
    if (busy) return;
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/quotations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });

      if (res.ok) {
        toast.success(successMsg);
        router.refresh();
        return;
      }
      if (res.status === 409) {
        toast.error("Invalid status change for this quotation.");
        return;
      }
      if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        if ((body as { error?: string }).error === "no_client_email") {
          toast.error("This quotation has no client email. Edit the draft and add one before sending.");
          return;
        }
      }
      toast.error("An unexpected error occurred. Please try again.");
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    if (busy) return;
    setBusy("resend");
    try {
      const res = await fetch(`/api/admin/quotations/${id}/resend`, { method: "POST" });
      if (res.ok) {
        toast.success("Quotation re-sent to the client.");
        router.refresh();
        return;
      }
      if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        if ((body as { error?: string }).error === "no_client_email") {
          toast.error("This quotation has no client email to resend to.");
          return;
        }
      }
      toast.error("Unable to resend the quotation. Please try again.");
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function del() {
    if (busy) return;
    if (!window.confirm("Delete this draft quotation? This cannot be undone.")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/quotations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Quotation deleted.");
        router.push("/admin/quotations");
        return;
      }
      toast.error("Unable to delete this quotation. Please try again.");
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function convert() {
    if (busy) return;
    setBusy("convert");
    try {
      const res = await fetch(`/api/admin/quotations/${id}/convert`, { method: "POST" });
      if (res.status === 201) {
        const body = await res.json().catch(() => ({}));
        toast.success("Converted to a draft invoice.");
        router.push(`/admin/invoices/${(body as { id: number }).id}`);
        return;
      }
      if (res.status === 409) {
        toast.error("This quotation has already been converted.");
        router.refresh();
        return;
      }
      toast.error("Unable to convert this quotation. Please try again.");
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  const label = (action: string, text: string) =>
    busy === action ? (
      <span className="inline-flex items-center gap-2">
        <Spinner /> {text}…
      </span>
    ) : (
      text
    );

  const disabledCls = "disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap gap-3">
      {status === "draft" && (
        <>
          <button type="button" onClick={() => patch("sent", "sent", "Quotation sent to the client.")} disabled={!!busy} className={`btn-metallic text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("sent", "Mark Sent")}
          </button>
          <button type="button" onClick={del} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg text-red-400 ${disabledCls}`}>
            {label("delete", "Delete")}
          </button>
        </>
      )}

      {status === "sent" && (
        <>
          <button type="button" onClick={() => patch("accepted", "accepted", "Quotation marked as accepted.")} disabled={!!busy} className={`btn-metallic text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("accepted", "Mark Accepted")}
          </button>
          <button type="button" onClick={() => patch("declined", "declined", "Quotation marked as declined.")} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("declined", "Mark Declined")}
          </button>
          <button type="button" onClick={resend} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("resend", "Resend")}
          </button>
          <button type="button" onClick={() => patch("draft", "revert", "Reverted to draft.")} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("revert", "Revert to Draft")}
          </button>
        </>
      )}

      {status === "declined" && (
        <button type="button" onClick={() => patch("sent", "sent", "Quotation re-opened and sent.")} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
          {label("sent", "Mark Sent")}
        </button>
      )}

      {status === "accepted" &&
        (convertedInvoiceId == null ? (
          <button type="button" onClick={convert} disabled={!!busy} className={`btn-metallic text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("convert", "Convert to Invoice")}
          </button>
        ) : (
          <Link href={`/admin/invoices/${convertedInvoiceId}`} className="btn-glass text-sm px-4 py-2 rounded-lg">
            View Invoice
          </Link>
        ))}
    </div>
  );
}
