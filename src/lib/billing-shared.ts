import { z } from "zod";

/** Line-item validation shared by invoices and quotations (identical shape). */
export const lineItemInput = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Please enter a description for each line item.")
    .max(2000, "A line-item description can be at most 2000 characters."),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(9999, "Quantity can be at most 9999."),
  unitPriceRands: z
    .number()
    .int("Unit price must be a whole rand amount.")
    .min(0, "Unit price can't be negative.")
    .max(99999999, "Unit price is too large."),
});
export type LineItemInput = z.infer<typeof lineItemInput>;

/**
 * Server-side total computation — the client never dictates totals.
 * Money convention: INTEGER rands (not cents), per Phase 3. Generic over
 * { quantity, unitPriceRands } so invoices AND quotations share one impl.
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
