import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { quotations, quotationLineItems } from "@/lib/db/schema";
import { ALLOWED_TRANSITIONS } from "@/lib/quotation-status";
import { generateQuotationPdfBuffer } from "@/lib/quotation-pdf";
import { sendEmail, emailLayout } from "@/lib/email";
import { formatQuotationNumber } from "@/lib/quotations";

export const dynamic = "force-dynamic";

const statusInput = z.object({ status: z.enum(["draft", "sent", "accepted", "declined"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

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

  const [q] = await db
    .select({ status: quotations.status, clientEmail: quotations.clientEmail, validUntil: quotations.validUntil })
    .from(quotations)
    .where(eq(quotations.id, numId));
  if (!q) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });

  if (!ALLOWED_TRANSITIONS[q.status as keyof typeof ALLOWED_TRANSITIONS]?.includes(target)) {
    return NextResponse.json({ error: "Invalid status transition." }, { status: 409 });
  }

  if (target === "sent") {
    // QUOTE-03: block before any write when there's nowhere to send (mirrors INVOICE-12).
    if (!q.clientEmail) return NextResponse.json({ error: "no_client_email" }, { status: 422 });

    await db.update(quotations).set({ status: "sent" }).where(eq(quotations.id, numId));

    // Best-effort email AFTER the status commits — sendEmail never throws, so a Resend
    // hiccup can't roll back the sent state. NO numbering step (Pitfall 5).
    const [updated] = await db.select().from(quotations).where(eq(quotations.id, numId));
    const lineItems = await db
      .select()
      .from(quotationLineItems)
      .where(eq(quotationLineItems.quotationId, numId))
      .orderBy(asc(quotationLineItems.sortOrder), asc(quotationLineItems.id));
    const pdfBuffer = await generateQuotationPdfBuffer(updated, lineItems);
    const reference = formatQuotationNumber(updated.id);
    await sendEmail({
      to: updated.clientEmail!,
      subject: `Quotation ${reference} from IT-Guru Online`,
      html: emailLayout(
        `Quotation ${reference}`,
        `<p>Good day,</p><p>Please find quotation ${reference} attached as a PDF, valid until ${updated.validUntil}. If you have any questions, simply reply to this email.</p><p>Thank you,<br/>IT-Guru Online</p>`
      ),
      attachments: [{ filename: `Quotation-${reference}.pdf`, content: pdfBuffer }],
    });
  } else {
    // sent→accepted / sent→declined / sent→draft (revert) / declined→sent handled above.
    await db.update(quotations).set({ status: target }).where(eq(quotations.id, numId));
  }

  return NextResponse.json({ ok: true });
}
