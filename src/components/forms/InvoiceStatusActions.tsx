"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

interface InvoiceStatusActionsProps {
  id: number;
  status: string;
}

export default function InvoiceStatusActions({ id, status }: InvoiceStatusActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(target: string, action: string, successMsg: string) {
    if (busy) return;
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/status`, {
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
        toast.error("Invalid status change for this invoice.");
        return;
      }
      if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        if ((body as { error?: string }).error === "no_client_email") {
          toast.error("This invoice has no client email. Edit the draft and add one before sending.");
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
      const res = await fetch(`/api/admin/invoices/${id}/resend`, { method: "POST" });
      if (res.ok) {
        toast.success("Invoice re-sent to the client.");
        router.refresh();
        return;
      }
      if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        if ((body as { error?: string }).error === "no_client_email") {
          toast.error("This invoice has no client email to resend to.");
          return;
        }
      }
      toast.error("Unable to resend the invoice. Please try again.");
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function del() {
    if (busy) return;
    if (!window.confirm("Delete this draft invoice? This cannot be undone.")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Invoice deleted.");
        router.push("/admin/invoices");
        return;
      }
      toast.error("Unable to delete this invoice. Please try again.");
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
          <button type="button" onClick={() => patch("sent", "sent", "Invoice sent to the client.")} disabled={!!busy} className={`btn-metallic text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("sent", "Mark Sent")}
          </button>
          <button type="button" onClick={del} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg text-red-400 ${disabledCls}`}>
            {label("delete", "Delete")}
          </button>
        </>
      )}

      {status === "sent" && (
        <>
          <button type="button" onClick={() => patch("paid", "paid", "Invoice marked as paid.")} disabled={!!busy} className={`btn-metallic text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("paid", "Mark Paid")}
          </button>
          <button type="button" onClick={resend} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("resend", "Resend")}
          </button>
          <button type="button" onClick={() => patch("draft", "revert", "Reverted to draft.")} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
            {label("revert", "Revert to Draft")}
          </button>
        </>
      )}

      {status === "paid" && (
        <button type="button" onClick={() => patch("sent", "undo", "Payment undone — back to sent.")} disabled={!!busy} className={`btn-glass text-sm px-4 py-2 rounded-lg ${disabledCls}`}>
          {label("undo", "Undo Paid")}
        </button>
      )}
    </div>
  );
}
