export type TicketStatus = "open" | "in_progress" | "resolved";

// Server-side transition guard. Reopen is allowed from resolved (07-RESEARCH Pattern 2).
export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["resolved", "open"],
  resolved: ["open", "in_progress"],
};

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "text-red-400 border border-red-500/50" },
  in_progress: { label: "In Progress", className: "text-[#00aaff] border border-[#00aaff]/40" },
  resolved: { label: "Resolved", className: "text-green-400 border border-green-500/40" },
};

export const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "text-(--text-secondary) border border-(--border-color)" },
  medium: { label: "Medium", className: "text-amber-400 border border-amber-500/50" },
  high: { label: "High", className: "text-red-400 border border-red-500/50" },
};
