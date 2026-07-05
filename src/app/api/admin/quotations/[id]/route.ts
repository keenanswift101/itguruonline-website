import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { withTxDb } from "@/lib/db/tx";
import { quotations, quotationLineItems, clients } from "@/lib/db/schema";
import { quotationInput } from "@/lib/quotations";
import { computeTotals } from "@/lib/billing-shared";

export const dynamic = "force-dynamic";

/** Thrown inside the transaction when the draft-only write guard fails. */
class EditLockError extends Error {}

const LOCK_RESPONSE = { error: "Only draft quotations can be edited." };

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

  const parsed = quotationInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const [existing] = await db
    .select({ status: quotations.status })
    .from(quotations)
    .where(eq(quotations.id, numId));
  if (!existing) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  // QUOTE-02 write lock — only draft quotations are editable. MUST be 409.
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
    // Atomic full replace: update quotation fields, drop old line items,
    // re-insert the new set. The UPDATE re-checks status = 'draft' inside
    // the transaction so a concurrent draft→sent transition cannot slip
    // an edit onto a sent quotation (the throw rolls everything back).
    await withTxDb((txDb) =>
      txDb.transaction(async (tx) => {
        const updated = await tx
          .update(quotations)
          .set({
            clientId: data.clientId ?? null,
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            billingAddress: data.billingAddress,
            issueDate: data.issueDate,
            validUntil: data.validUntil,
            totalRands,
          })
          .where(and(eq(quotations.id, numId), eq(quotations.status, "draft")))
          .returning({ id: quotations.id });
        if (updated.length === 0) throw new EditLockError();

        await tx.delete(quotationLineItems).where(eq(quotationLineItems.quotationId, numId));
        if (lines.length) {
          await tx.insert(quotationLineItems).values(
            lines.map((l, idx) => ({
              quotationId: numId,
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
    .select({ status: quotations.status })
    .from(quotations)
    .where(eq(quotations.id, numId));
  if (!existing) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  // Only drafts may be deleted — sent/accepted/declined are immutable records (409).
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft quotations can be deleted." },
      { status: 409 }
    );
  }

  // status guard repeated in the WHERE; line items removed via FK cascade.
  await db
    .delete(quotations)
    .where(and(eq(quotations.id, numId), eq(quotations.status, "draft")));

  return NextResponse.json({ ok: true });
}
