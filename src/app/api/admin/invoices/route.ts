import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withTxDb } from "@/lib/db/tx";
import { invoices, invoiceLineItems } from "@/lib/db/schema";
import { invoiceInput, computeTotals } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const data = parsed.data;
  const { lines, totalRands } = computeTotals(data.lineItems);

  // Atomic invoice + line items write. The neon-http driver cannot run
  // transactions, so withTxDb opens a short-lived WebSocket client (see
  // src/lib/db/tx.ts). status is NOT set here — it defaults to 'draft' in
  // the schema, and numbering stays NULL until the draft→sent transition.
  const invoice = await withTxDb((db) =>
    db.transaction(async (tx) => {
      const [invoice] = await tx
        .insert(invoices)
        .values({
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          billingAddress: data.billingAddress,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          totalRands,
        })
        .returning();

      if (lines.length) {
        await tx.insert(invoiceLineItems).values(
          lines.map((l, idx) => ({
            invoiceId: invoice.id,
            description: l.description,
            quantity: l.quantity,
            unitPriceRands: l.unitPriceRands,
            lineTotalRands: l.lineTotalRands,
            sortOrder: idx,
          }))
        );
      }

      return invoice;
    })
  );

  return NextResponse.json({ ok: true, id: invoice.id }, { status: 201 });
}
