import { z } from "zod";

export const lineItemInput = z.object({
  description: z.string().trim().min(1).max(2000),
  quantity: z.number().int().min(1).max(9999),
  unitPriceRands: z.number().int().min(0).max(99999999),
});

export const invoiceInput = z.object({
  clientName: z.string().trim().min(1).max(255),
  clientEmail: z
    .string()
    .trim()
    .email()
    .max(320)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  billingAddress: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lineItems: z.array(lineItemInput).max(100).default([]),
});

export type InvoiceInput = z.infer<typeof invoiceInput>;
export type LineItemInput = z.infer<typeof lineItemInput>;

/**
 * Server-side total computation — the client never dictates totals.
 * Money convention: INTEGER rands (not cents), per Phase 3.
 */
export function computeTotals<T extends { quantity: number; unitPriceRands: number }>(
  items: T[]
) {
  const lines = items.map((i) => ({
    ...i,
    lineTotalRands: i.quantity * i.unitPriceRands,
  }));
  const totalRands = lines.reduce((s, l) => s + l.lineTotalRands, 0);
  return { lines, totalRands };
}

/**
 * INV-YYYY-NNN display format (D-04). Draft invoices have no number
 * assigned (fiscalYear/sequenceNumber NULL) and render as "DRAFT".
 */
export function formatInvoiceNumber(
  fiscalYear: number | null,
  sequenceNumber: number | null
): string {
  if (fiscalYear == null || sequenceNumber == null) return "DRAFT";
  return `INV-${fiscalYear}-${String(sequenceNumber).padStart(3, "0")}`;
}
