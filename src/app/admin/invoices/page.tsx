import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { invoices } from "@/lib/db/schema";
import { formatInvoiceNumber } from "@/lib/invoices";
import { isOverdue, STATUS_BADGE, OVERDUE_BADGE } from "@/lib/invoice-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices" };

const FILTERABLE_STATUSES = ["draft", "sent", "paid"] as const;
type StatusFilter = (typeof FILTERABLE_STATUSES)[number];

const FILTER_LINKS: { label: string; value: StatusFilter | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
];

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default async function InvoicesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { status } = await searchParams;
  const statusFilter = FILTERABLE_STATUSES.find((s) => s === status);

  const base = db.select().from(invoices);
  const rows = await (statusFilter
    ? base.where(eq(invoices.status, statusFilter)).orderBy(desc(invoices.createdAt))
    : base.orderBy(desc(invoices.createdAt)));

  const csvHref = `/api/admin/invoices/csv${statusFilter ? `?status=${statusFilter}` : ""}`;

  return (
    <main className="p-8">
      <p className="mb-4">
        <Link href="/admin/dashboard" className="text-(--text-secondary) hover:text-(--text-primary) text-sm underline">
          ← Back to Dashboard
        </Link>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">Invoices</h1>
        <div className="flex gap-3">
          <a href={csvHref} className="btn-glass text-sm px-4 py-2 rounded-lg">
            Export CSV
          </a>
          <Link href="/admin/invoices/new" className="btn-metallic text-sm px-4 py-2 rounded-lg">
            New Invoice
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {FILTER_LINKS.map(({ label, value }) => {
          const href = value ? `/admin/invoices?status=${value}` : "/admin/invoices";
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
          <p className="p-8 text-center text-(--text-secondary) text-sm">No invoices yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border-color) text-left text-(--text-secondary)">
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Client Name</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const badge = STATUS_BADGE[inv.status] ?? STATUS_BADGE.draft;
                const overdue = isOverdue(inv.status, inv.dueDate);
                return (
                  <tr key={inv.id} className="border-b border-(--border-color) last:border-b-0">
                    <td className="px-4 py-3 text-(--text-primary) font-medium">
                      {formatInvoiceNumber(inv.fiscalYear, inv.sequenceNumber)}
                    </td>
                    <td className="px-4 py-3 text-(--text-primary)">{inv.clientName}</td>
                    <td className="px-4 py-3 text-(--text-secondary)">{inv.dueDate}</td>
                    <td className="px-4 py-3 text-(--text-primary)">R{inv.totalRands}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge label={badge.label} className={badge.className} />
                        {overdue && <Badge label={OVERDUE_BADGE.label} className={OVERDUE_BADGE.className} />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
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
