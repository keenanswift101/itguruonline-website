/**
 * Shared invoice status helpers — used by the list page (04-04) and the
 * detail page (04-05). Overdue is computed at read time (D-06), never
 * stored: status === 'sent' AND dueDate < today.
 */

export function isOverdue(status: string, dueDate: string): boolean {
  return status === "sent" && new Date(dueDate) < new Date(new Date().toISOString().slice(0, 10));
}

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-(--bg-primary) text-(--text-secondary) border border-(--border-color)",
  },
  sent: {
    label: "Sent",
    className: "text-[#00aaff] border border-[#00aaff]/40",
  },
  paid: {
    label: "Paid",
    className: "text-green-400 border border-green-500/40",
  },
};

export const OVERDUE_BADGE = { label: "Overdue", className: "text-red-400 border border-red-500/50" };
