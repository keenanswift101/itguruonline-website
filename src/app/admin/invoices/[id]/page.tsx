import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { invoices, invoiceLineItems } from "@/lib/db/schema";
import { formatInvoiceNumber } from "@/lib/invoices";
import { isOverdue, STATUS_BADGE, OVERDUE_BADGE } from "@/lib/invoice-status";
import InvoiceForm from "@/components/forms/InvoiceForm";
import InvoiceStatusActions from "@/components/forms/InvoiceStatusActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice" };

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default async function InvoiceDetailPage({
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

  const [inv] = await db.select().from(invoices).where(eq(invoices.id, numId));
  if (!inv) {
    notFound();
  }

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, numId))
    .orderBy(asc(invoiceLineItems.sortOrder), asc(invoiceLineItems.id));

  const badge = STATUS_BADGE[inv.status] ?? STATUS_BADGE.draft;
  const overdue = isOverdue(inv.status, inv.dueDate);
  const invoiceNumber = formatInvoiceNumber(inv.fiscalYear, inv.sequenceNumber);

  return (
    <main className="p-8">
      <p className="mb-4">
        <Link href="/admin/invoices" className="text-(--text-secondary) hover:text-(--text-primary) text-sm underline">
          ← Back to Invoices
        </Link>
      </p>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--text-primary) mb-2">{invoiceNumber}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge label={badge.label} className={badge.className} />
            {overdue && <Badge label={OVERDUE_BADGE.label} className={OVERDUE_BADGE.className} />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <InvoiceStatusActions id={inv.id} status={inv.status} />
          <a
            href={`/api/admin/invoices/${inv.id}/pdf`}
            className="btn-glass text-sm px-4 py-2 rounded-lg"
          >
            Download PDF
          </a>
        </div>
      </div>

      {inv.status === "paid" && inv.paidAt && (
        <p className="mb-6 text-sm text-green-400">
          Paid on {new Date(inv.paidAt).toISOString().slice(0, 10)}
        </p>
      )}

      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-6">
        {inv.status === "draft" ? (
          <InvoiceForm
            invoiceId={inv.id}
            initial={{
              clientName: inv.clientName,
              clientEmail: inv.clientEmail ?? "",
              billingAddress: inv.billingAddress ?? "",
              issueDate: inv.issueDate,
              dueDate: inv.dueDate,
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
                <p className="text-(--text-primary)">{inv.clientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-(--text-secondary) mb-1">Client Email</p>
                <p className="text-(--text-primary)">{inv.clientEmail || "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-(--text-secondary) mb-1">Billing Address</p>
              <p className="text-(--text-primary) whitespace-pre-line">{inv.billingAddress || "—"}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-(--text-secondary) mb-1">Issue Date</p>
                <p className="text-(--text-primary)">{inv.issueDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-(--text-secondary) mb-1">Due Date</p>
                <p className="text-(--text-primary)">{inv.dueDate}</p>
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
                  Invoice Total: <span>R{inv.totalRands}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
