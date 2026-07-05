import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { quotations } from "@/lib/db/schema";
import { formatQuotationNumber } from "@/lib/quotations";
import { isExpired, STATUS_BADGE, EXPIRED_BADGE } from "@/lib/quotation-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotations" };

const FILTERABLE_STATUSES = ["draft", "sent", "accepted", "declined"] as const;
type StatusFilter = (typeof FILTERABLE_STATUSES)[number];

const FILTER_LINKS: { label: string; value: StatusFilter | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Accepted", value: "accepted" },
  { label: "Declined", value: "declined" },
];

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default async function QuotationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { status } = await searchParams;
  const statusFilter = FILTERABLE_STATUSES.find((s) => s === status);

  const base = db.select().from(quotations);
  const rows = await (statusFilter
    ? base.where(eq(quotations.status, statusFilter)).orderBy(desc(quotations.createdAt))
    : base.orderBy(desc(quotations.createdAt)));

  return (
    <main className="p-8">
      <p className="mb-4">
        <Link href="/admin/dashboard" className="text-(--text-secondary) hover:text-(--text-primary) text-sm underline">
          ← Back to Dashboard
        </Link>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">Quotations</h1>
        <div className="flex gap-3">
          <Link href="/admin/quotations/new" className="btn-metallic text-sm px-4 py-2 rounded-lg">
            New Quotation
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {FILTER_LINKS.map(({ label, value }) => {
          const href = value ? `/admin/quotations?status=${value}` : "/admin/quotations";
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
          <p className="p-8 text-center text-(--text-secondary) text-sm">No quotations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border-color) text-left text-(--text-secondary)">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Client Name</th>
                <th className="px-4 py-3 font-medium">Valid Until</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => {
                const badge = STATUS_BADGE[q.status] ?? STATUS_BADGE.draft;
                const expired = isExpired(q.status, q.validUntil);
                return (
                  <tr key={q.id} className="border-b border-(--border-color) last:border-b-0">
                    <td className="px-4 py-3 text-(--text-primary) font-medium">
                      {formatQuotationNumber(q.id)}
                    </td>
                    <td className="px-4 py-3 text-(--text-primary)">{q.clientName}</td>
                    <td className="px-4 py-3 text-(--text-secondary)">{q.validUntil}</td>
                    <td className="px-4 py-3 text-(--text-primary)">R{q.totalRands}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge label={badge.label} className={badge.className} />
                        {expired && <Badge label={EXPIRED_BADGE.label} className={EXPIRED_BADGE.className} />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/admin/quotations/${q.id}`}
                          className="text-(--text-secondary) hover:text-(--text-primary) underline"
                        >
                          View
                        </Link>
                        <a
                          href={`/api/admin/quotations/${q.id}/pdf`}
                          className="text-(--text-secondary) hover:text-(--text-primary) underline"
                        >
                          PDF
                        </a>
                      </div>
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
