export type QuotationStatus = "draft" | "sent" | "accepted" | "declined";

// Server-side transition guard. accepted is TERMINAL (QUOTE-05 convert depends on it
// staying stable once converted_invoice_id may be set). declined→sent = re-open/re-send.
export const ALLOWED_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "declined", "draft"],
  accepted: [],
  declined: ["sent"],
};

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-(--bg-primary) text-(--text-secondary) border border-(--border-color)",
  },
  sent: {
    label: "Sent",
    className: "text-[#00aaff] border border-[#00aaff]/40",
  },
  accepted: {
    label: "Accepted",
    className: "text-green-400 border border-green-500/40",
  },
  declined: {
    label: "Declined",
    className: "text-red-400 border border-red-500/50",
  },
};

export const EXPIRED_BADGE = { label: "Expired", className: "text-amber-400 border border-amber-500/50" };

/** Computed at read time (never stored): a sent quote past its valid_until date. */
export function isExpired(status: string, validUntil: string): boolean {
  return status === "sent" && new Date(validUntil) < new Date(new Date().toISOString().slice(0, 10));
}
