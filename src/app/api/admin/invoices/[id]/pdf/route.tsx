import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { invoices, invoiceLineItems } from "@/lib/db/schema";
import { formatInvoiceNumber } from "@/lib/invoices";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return new Response("Invalid id", { status: 400 });
  }

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, numId));
  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, numId))
    .orderBy(asc(invoiceLineItems.sortOrder), asc(invoiceLineItems.id));

  const buffer = await generateInvoicePdfBuffer(invoice, lineItems);

  const filename =
    invoice.status === "draft"
      ? "Draft-Invoice.pdf"
      : `Invoice-${formatInvoiceNumber(invoice.fiscalYear, invoice.sequenceNumber)}.pdf`;

  // new Uint8Array(...) — Buffer<ArrayBufferLike> is rejected by the DOM
  // BodyInit type under this tsconfig even though it works at runtime.
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
