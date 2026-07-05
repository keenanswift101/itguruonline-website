import { z } from "zod";

/** Line-item validation shared by invoices and quotations (identical shape). */
export const lineItemInput = z.object({
  description: z.string().trim().min(1).max(2000),
  quantity: z.number().int().min(1).max(9999),
  unitPriceRands: z.number().int().min(0).max(99999999),
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
