import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { quotations, quotationLineItems } from "@/lib/db/schema";
import { formatQuotationNumber } from "@/lib/quotations";
import { generateQuotationPdfBuffer } from "@/lib/quotation-pdf";
import { sendEmail, emailLayout } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [q] = await db.select().from(quotations).where(eq(quotations.id, numId));
  if (!q) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  // Only a sent quotation can be re-sent.
  if (q.status !== "sent") {
    return NextResponse.json({ error: "Only sent quotations can be re-sent." }, { status: 409 });
  }
  if (!q.clientEmail) {
    return NextResponse.json({ error: "no_client_email" }, { status: 422 });
  }

  const lineItems = await db
    .select()
    .from(quotationLineItems)
    .where(eq(quotationLineItems.quotationId, numId))
    .orderBy(asc(quotationLineItems.sortOrder), asc(quotationLineItems.id));
  const pdfBuffer = await generateQuotationPdfBuffer(q, lineItems);
  const reference = formatQuotationNumber(q.id);

  await sendEmail({
    to: q.clientEmail,
    subject: `Quotation ${reference} from IT-Guru Online`,
    html: emailLayout(
      `Quotation ${reference}`,
      `<p>Good day,</p><p>Please find quotation ${reference} attached as a PDF, valid until ${q.validUntil}.</p><p>Thank you,<br/>IT-Guru Online</p>`
    ),
    attachments: [{ filename: `Quotation-${reference}.pdf`, content: pdfBuffer }],
  });

  return NextResponse.json({ ok: true });
}
