import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getTickets } from "@/lib/ticket-query";
import { STATUS_BADGE, PRIORITY_BADGE } from "@/lib/ticket-status";
import type { TicketStatus } from "@/lib/ticket-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tickets" };

const FILTERABLE_STATUSES = ["open", "in_progress", "resolved"] as const;

const FILTER_LINKS: { label: string; value: TicketStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default async function TicketsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { status } = await searchParams;
  const statusFilter = FILTERABLE_STATUSES.find((s) => s === status);

  const rows = await getTickets(statusFilter);

  return (
    <main className="p-8">
      <p className="mb-4">
        <Link href="/admin/dashboard" className="text-(--text-secondary) hover:text-(--text-primary) text-sm underline">
          ← Back to Dashboard
        </Link>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">Tickets</h1>
        <div className="flex gap-3">
          <Link href="/admin/tickets/new" className="btn-metallic text-sm px-4 py-2 rounded-lg">
            New Ticket
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {FILTER_LINKS.map(({ label, value }) => {
          const href = value ? `/admin/tickets?status=${value}` : "/admin/tickets";
          const active = statusFilter === value;
          return (
            <Link
              key={label}
              href={href}
              className={
                "rounded-lg px-3 py-1.5 text-sm border transition-colors " +
                (active
                  ? "border-[#00aaff]/60 text-[#00aaff] bg-[#00aaff]/10"
                  : "border-(--border-color) text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5")
              }
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-(--text-secondary) text-sm">No tickets yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border-color) text-left text-(--text-secondary)">
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const statusBadge = STATUS_BADGE[t.status] ?? STATUS_BADGE.open;
                const priorityBadge = PRIORITY_BADGE[t.priority] ?? PRIORITY_BADGE.medium;
                return (
                  <tr key={t.id} className="border-b border-(--border-color) last:border-b-0">
                    <td className="px-4 py-3 text-(--text-primary) font-medium">
                      <Link href={`/admin/tickets/${t.id}`} className="hover:underline">
                        {t.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-(--text-primary)">{t.clientName}</td>
                    <td className="px-4 py-3">
                      <Badge label={priorityBadge.label} className={priorityBadge.className} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={statusBadge.label} className={statusBadge.className} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="text-(--text-secondary) hover:text-(--text-primary) underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
