import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { withTxDb } from "@/lib/db/tx";
import { quotations, quotationLineItems, invoices, invoiceLineItems } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Thrown inside the tx when the quotation was already converted. */
class AlreadyConvertedError extends Error {}
/** Thrown inside the tx when the quotation isn't in the accepted state. */
class InvalidStateError extends Error {}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const invoice = await withTxDb((db) =>
      db.transaction(async (tx) => {
        const [q] = await tx.select().from(quotations).where(eq(quotations.id, numId));
        if (!q) throw new Error("NOT_FOUND");
        if (q.convertedInvoiceId != null) throw new AlreadyConvertedError();
        if (q.status !== "accepted") throw new InvalidStateError();

        const lineItems = await tx
          .select()
          .from(quotationLineItems)
          .where(eq(quotationLineItems.quotationId, numId))
          .orderBy(asc(quotationLineItems.sortOrder), asc(quotationLineItems.id));

        const today = new Date();
        const issueDateStr = today.toISOString().slice(0, 10);
        // 30-day due date — matches recurring-billing.ts's existing convention.
        const dueDateStr = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const [invoice] = await tx
          .insert(invoices)
          .values({
            clientId: q.clientId,
            clientName: q.clientName,
            clientEmail: q.clientEmail,
            billingAddress: q.billingAddress,
            issueDate: issueDateStr,
            dueDate: dueDateStr,
            totalRands: q.totalRands,
            // status defaults to 'draft' in the schema — QUOTE-05 requires a DRAFT invoice.
          })
          .returning();

        if (lineItems.length) {
          await tx.insert(invoiceLineItems).values(
            lineItems.map((l, idx) => ({
              invoiceId: invoice.id,
              description: l.description,
              quantity: l.quantity,
              unitPriceRands: l.unitPriceRands,
              lineTotalRands: l.lineTotalRands,
              sortOrder: idx,
            }))
          );
        }

        await tx.update(quotations).set({ convertedInvoiceId: invoice.id }).where(eq(quotations.id, numId));
        return invoice;
      })
    );
    return NextResponse.json({ id: invoice.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AlreadyConvertedError) {
      return NextResponse.json({ error: "Quotation already converted." }, { status: 409 });
    }
    if (err instanceof InvalidStateError) {
      return NextResponse.json({ error: "Only accepted quotations can be converted." }, { status: 409 });
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }
    throw err;
  }
}
