import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";
import type { invoices, invoiceLineItems } from "@/lib/db/schema";

type InvoiceRow = typeof invoices.$inferSelect;
type LineItemRow = typeof invoiceLineItems.$inferSelect;

/**
 * Single source of truth for rendering an invoice to PDF bytes.
 * Reused by the download route AND the send/resend email paths so the
 * emailed PDF can never drift from the downloaded one.
 */
export async function generateInvoicePdfBuffer(
  invoice: InvoiceRow,
  lineItems: LineItemRow[],
): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} lineItems={lineItems} />);
}
