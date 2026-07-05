import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { withTxDb } from "@/lib/db/tx";
import { quotations, quotationLineItems, clients } from "@/lib/db/schema";
import { quotationInput } from "@/lib/quotations";
import { computeTotals } from "@/lib/billing-shared";

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

  const parsed = quotationInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
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

  // Atomic quotation + line items write. The neon-http driver cannot run
  // transactions, so withTxDb opens a short-lived WebSocket client (see
  // src/lib/db/tx.ts). status is NOT set here — it defaults to 'draft' in
  // the schema. Quotations have no gapless numbering (not a SARS document).
  const quotation = await withTxDb((db) =>
    db.transaction(async (tx) => {
      const [q] = await tx
        .insert(quotations)
        .values({
          clientId: data.clientId ?? null,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          billingAddress: data.billingAddress,
          issueDate: data.issueDate,
          validUntil: data.validUntil,
          totalRands,
        })
        .returning();

      if (lines.length) {
        await tx.insert(quotationLineItems).values(
          lines.map((l, idx) => ({
            quotationId: q.id,
            description: l.description,
            quantity: l.quantity,
            unitPriceRands: l.unitPriceRands,
            lineTotalRands: l.lineTotalRands,
            sortOrder: idx,
          }))
        );
      }

      return q;
    })
  );

  return NextResponse.json({ ok: true, id: quotation.id }, { status: 201 });
}
