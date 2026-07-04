import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { invoices, invoiceLineItems } from "@/lib/db/schema";
import { formatInvoiceNumber } from "@/lib/invoices";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";
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

  const [inv] = await db.select().from(invoices).where(eq(invoices.id, numId));
  if (!inv) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  // Only a sent invoice can be re-sent (a draft has no assigned number yet).
  if (inv.status !== "sent") {
    return NextResponse.json({ error: "Only sent invoices can be re-sent." }, { status: 409 });
  }
  if (!inv.clientEmail) {
    return NextResponse.json({ error: "no_client_email" }, { status: 422 });
  }

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, numId))
    .orderBy(asc(invoiceLineItems.sortOrder), asc(invoiceLineItems.id));
  const pdfBuffer = await generateInvoicePdfBuffer(inv, lineItems);
  const invoiceNumber = formatInvoiceNumber(inv.fiscalYear, inv.sequenceNumber);

  await sendEmail({
    to: inv.clientEmail,
    subject: `Invoice ${invoiceNumber} from IT-Guru Online`,
    html: emailLayout(
      `Invoice ${invoiceNumber}`,
      `<p>Good day,</p><p>Please find invoice ${invoiceNumber} attached as a PDF.</p><p>Thank you,<br/>IT-Guru Online</p>`
    ),
    attachments: [{ filename: `Invoice-${invoiceNumber}.pdf`, content: pdfBuffer }],
  });

  return NextResponse.json({ ok: true });
}
