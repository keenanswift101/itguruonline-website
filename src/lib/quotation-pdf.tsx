import { renderToBuffer } from "@react-pdf/renderer";
import { QuotationDocument } from "@/components/pdf/QuotationDocument";
import type { quotations, quotationLineItems } from "@/lib/db/schema";

type QuotationRow = typeof quotations.$inferSelect;
type LineItemRow = typeof quotationLineItems.$inferSelect;

/**
 * Single source of truth for rendering a quotation to PDF bytes.
 * Reused by the download route AND (10-04) the send/resend email paths so
 * the emailed PDF can never drift from the downloaded one.
 */
export async function generateQuotationPdfBuffer(
  quotation: QuotationRow,
  lineItems: LineItemRow[],
): Promise<Buffer> {
  return renderToBuffer(<QuotationDocument quotation={quotation} lineItems={lineItems} />);
}
