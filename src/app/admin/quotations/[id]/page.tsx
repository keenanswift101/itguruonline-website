import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { quotations, quotationLineItems } from "@/lib/db/schema";
import { getClientsForPicker } from "@/lib/client-query";
import { formatQuotationNumber } from "@/lib/quotations";
import { isExpired, STATUS_BADGE, EXPIRED_BADGE } from "@/lib/quotation-status";
import QuotationForm from "@/components/forms/QuotationForm";
import QuotationStatusActions from "@/components/forms/QuotationStatusActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotation" };

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    notFound();
  }

  const [q] = await db.select().from(quotations).where(eq(quotations.id, numId));
  if (!q) {
    notFound();
  }

  const lineItems = await db
    .select()
    .from(quotationLineItems)
    .where(eq(quotationLineItems.quotationId, numId))
    .orderBy(asc(quotationLineItems.sortOrder), asc(quotationLineItems.id));

  const clients = await getClientsForPicker();

  const badge = STATUS_BADGE[q.status] ?? STATUS_BADGE.draft;
  const expired = isExpired(q.status, q.validUntil);
  const reference = formatQuotationNumber(q.id);

  return (
    <main className="p-8">
      <p className="mb-4">
        <Link href="/admin/quotations" className="text-(--text-secondary) hover:text-(--text-primary) text-sm underline">
          ← Back to Quotations
        </Link>
      </p>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--text-primary) mb-2">{reference}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge label={badge.label} className={badge.className} />
            {expired && <Badge label={EXPIRED_BADGE.label} className={EXPIRED_BADGE.className} />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <QuotationStatusActions id={q.id} status={q.status} convertedInvoiceId={q.convertedInvoiceId} />
          <a
            href={`/api/admin/quotations/${q.id}/pdf`}
            className="btn-glass text-sm px-4 py-2 rounded-lg"
          >
            Download PDF
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-6">
        {q.status === "draft" ? (
          <QuotationForm
            quotationId={q.id}
            clients={clients}
            initialClientId={q.clientId}
            initial={{
              clientName: q.clientName,
              clientEmail: q.clientEmail ?? "",
              billingAddress: q.billingAddress ?? "",
              issueDate: q.issueDate,
              validUntil: q.validUntil,
              lineItems: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPriceRands: item.unitPriceRands,
              })),
            }}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-(--text-secondary) mb-1">Client Name</p>
                <p className="text-(--text-primary)">{q.clientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-(--text-secondary) mb-1">Client Email</p>
                <p className="text-(--text-primary)">{q.clientEmail || "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-(--text-secondary) mb-1">Billing Address</p>
              <p className="text-(--text-primary) whitespace-pre-line">{q.billingAddress || "—"}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-(--text-secondary) mb-1">Issue Date</p>
                <p className="text-(--text-primary)">{q.issueDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-(--text-secondary) mb-1">Valid Until</p>
                <p className="text-(--text-primary)">{q.validUntil}</p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-(--text-primary) mb-2">Line Items</h2>
              <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--border-color) text-left text-(--text-secondary)">
                      <th className="px-3 py-2 font-medium">Description</th>
                      <th className="px-3 py-2 font-medium w-24">Qty</th>
                      <th className="px-3 py-2 font-medium w-32">Unit Price (R)</th>
                      <th className="px-3 py-2 font-medium w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-(--border-color) last:border-b-0">
                        <td className="px-3 py-2 text-(--text-primary)">{item.description}</td>
                        <td className="px-3 py-2 text-(--text-primary)">{item.quantity}</td>
                        <td className="px-3 py-2 text-(--text-primary)">R{item.unitPriceRands}</td>
                        <td className="px-3 py-2 text-(--text-primary)">R{item.lineTotalRands}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-3">
                <p className="text-(--text-primary) font-semibold text-base">
                  Quotation Total: <span>R{q.totalRands}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
