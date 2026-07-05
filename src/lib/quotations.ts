import { z } from "zod";
import { lineItemInput } from "@/lib/billing-shared";

export const quotationInput = z.object({
  clientId: z.number().int().positive().nullable().optional(), // null/undefined = one-off free-text
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
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lineItems: z.array(lineItemInput).max(100).default([]),
});
export type QuotationInput = z.infer<typeof quotationInput>;

/** QUO-0001 reference derived from the serial PK — no gapless numbering (not a SARS doc). */
export function formatQuotationNumber(id: number): string {
  return `QUO-${String(id).padStart(4, "0")}`;
}
