import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { withTxDb } from "@/lib/db/tx";
import { invoices, invoiceLineItems, clients } from "@/lib/db/schema";
import { invoiceInput, computeTotals } from "@/lib/invoices";

export const dynamic = "force-dynamic";

/** Thrown inside the transaction when the draft-only write guard fails. */
class EditLockError extends Error {}

const LOCK_RESPONSE = { error: "Only draft invoices can be edited." };

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = invoiceInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const [existing] = await db
    .select({ status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, numId));
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  // INVOICE-02 write lock — only Draft invoices are editable. MUST be 409.
  if (existing.status !== "draft") {
    return NextResponse.json(LOCK_RESPONSE, { status: 409 });
  }

  const data = parsed.data;

  if (data.clientId != null) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, data.clientId));
    if (!client) {
      return NextResponse.json(
        { error: "Validation failed.", fields: { clientId: ["Client not found."] } },
        { status: 422 }
      );
    }
  }

  const { lines, totalRands } = computeTotals(data.lineItems);

  try {
    // Atomic full replace: update invoice fields, drop old line items,
    // re-insert the new set. The UPDATE re-checks status = 'draft' inside
    // the transaction so a concurrent draft→sent transition cannot slip
    // an edit onto a sent invoice (the throw rolls everything back).
    await withTxDb((txDb) =>
      txDb.transaction(async (tx) => {
        const updated = await tx
          .update(invoices)
          .set({
            clientId: data.clientId ?? null,
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            billingAddress: data.billingAddress,
            issueDate: data.issueDate,
            dueDate: data.dueDate,
            totalRands,
          })
          .where(and(eq(invoices.id, numId), eq(invoices.status, "draft")))
          .returning({ id: invoices.id });
        if (updated.length === 0) throw new EditLockError();

        await tx.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, numId));
        if (lines.length) {
          await tx.insert(invoiceLineItems).values(
            lines.map((l, idx) => ({
              invoiceId: numId,
              description: l.description,
              quantity: l.quantity,
              unitPriceRands: l.unitPriceRands,
              lineTotalRands: l.lineTotalRands,
              sortOrder: idx,
            }))
          );
        }
      })
    );
  } catch (err) {
    if (err instanceof EditLockError) {
      return NextResponse.json(LOCK_RESPONSE, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [existing] = await db
    .select({ status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, numId));
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  // Only Drafts may be deleted — Sent/Paid are immutable records (409).
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft invoices can be deleted." },
      { status: 409 }
    );
  }

  // status guard repeated in the WHERE; line items removed via FK cascade.
  await db
    .delete(invoices)
    .where(and(eq(invoices.id, numId), eq(invoices.status, "draft")));

  return NextResponse.json({ ok: true });
}
