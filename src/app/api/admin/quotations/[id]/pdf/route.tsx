import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { quotations, quotationLineItems } from "@/lib/db/schema";
import { formatQuotationNumber } from "@/lib/quotations";
import { generateQuotationPdfBuffer } from "@/lib/quotation-pdf";

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

  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, numId));
  if (!quotation) {
    return new Response("Quotation not found", { status: 404 });
  }

  const lineItems = await db
    .select()
    .from(quotationLineItems)
    .where(eq(quotationLineItems.quotationId, numId))
    .orderBy(asc(quotationLineItems.sortOrder), asc(quotationLineItems.id));

  const buffer = await generateQuotationPdfBuffer(quotation, lineItems);
  const filename = `Quotation-${formatQuotationNumber(quotation.id)}.pdf`;

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
