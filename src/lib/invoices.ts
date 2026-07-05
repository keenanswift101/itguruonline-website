import { z } from "zod";
import { lineItemInput } from "@/lib/billing-shared";

export { lineItemInput, computeTotals } from "@/lib/billing-shared";
export type { LineItemInput } from "@/lib/billing-shared";

export const invoiceInput = z.object({
  clientId: z.number().int().positive().nullable().optional(), // null/undefined = one-off free-text invoice
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
