import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { invoices } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const statusInput = z.object({
  status: z.enum(["draft", "sent", "paid"]),
});

type InvoiceStatus = z.infer<typeof statusInput>["status"];

// Server-side transition guard (D-06) — never trust the client:
//   draft → sent  (assigns gapless INV number)
//   sent  → paid  (records paid_at) | draft (unpublish — clears number)
//   paid  → sent  (undo — clears paid_at)
const ALLOWED_TRANSITIONS: Record<string, InvoiceStatus[]> = {
  draft: ["sent"],
  sent: ["paid", "draft"],
  paid: ["sent"],
};

export async function PATCH(
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

  const parsed = statusInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const target = parsed.data.status;

  const [inv] = await db
    .select({ status: invoices.status, issueDate: invoices.issueDate })
    .from(invoices)
    .where(eq(invoices.id, numId));
  if (!inv) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (!ALLOWED_TRANSITIONS[inv.status]?.includes(target)) {
    return NextResponse.json({ error: "Invalid status transition." }, { status: 409 });
  }

  if (inv.status === "draft" && target === "sent") {
    // Gapless number assignment (D-04, INVOICE-03): single atomic UPDATE with
    // a correlated subquery — the MAX(sequence_number)+1 read and the write
    // happen in one statement, so deleted drafts never consume a number and
    // no lock round-trip is needed (the neon-http driver can't hold FOR
    // UPDATE locks anyway). Single-admin safe at READ COMMITTED; upgrade to
    // SERIALIZABLE for multi-user.
    const fiscalYear = new Date(inv.issueDate).getFullYear();
    await db.execute(sql`
      UPDATE invoices
      SET status = 'sent',
          fiscal_year = ${fiscalYear},
          sequence_number = (
            SELECT COALESCE(MAX(sequence_number), 0) + 1
            FROM invoices
            WHERE fiscal_year = ${fiscalYear}
          )
      WHERE id = ${numId} AND status = 'draft'
    `);
  } else if (inv.status === "sent" && target === "paid") {
    // D-09: mark paid records the payment timestamp.
    await db
      .update(invoices)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(invoices.id, numId));
  } else if (inv.status === "paid" && target === "sent") {
    // Undo mark-paid.
    await db
      .update(invoices)
      .set({ status: "sent", paidAt: null })
      .where(eq(invoices.id, numId));
  } else {
    // sent → draft (unpublish): clear the number per D-06 recommendation —
    // re-sending re-assigns a fresh number so clients never see a reused one.
    await db
      .update(invoices)
      .set({ status: "draft", fiscalYear: null, sequenceNumber: null })
      .where(eq(invoices.id, numId));
  }

  return NextResponse.json({ ok: true });
}
