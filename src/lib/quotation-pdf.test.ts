import { describe, it, expect } from "vitest";
import { generateQuotationPdfBuffer } from "@/lib/quotation-pdf";

describe("generateQuotationPdfBuffer", () => {
  it("returns a non-empty Buffer starting with the %PDF magic header", async () => {
    const buf = await generateQuotationPdfBuffer(
      {
        id: 1,
        clientName: "Acme",
        clientEmail: null,
        billingAddress: null,
        issueDate: "2026-07-05",
        validUntil: "2026-08-05",
        status: "draft",
        totalRands: 100,
        convertedInvoiceId: null,
        clientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
      [{ description: "Item", quantity: 1, unitPriceRands: 100, lineTotalRands: 100 } as never],
    );
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
