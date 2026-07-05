import { describe, it, expect } from "vitest";
import { formatQuotationNumber, quotationInput } from "@/lib/quotations";

describe("formatQuotationNumber", () => {
  it("zero-pads the id to 4 digits", () => {
    expect(formatQuotationNumber(1)).toBe("QUO-0001");
    expect(formatQuotationNumber(42)).toBe("QUO-0042");
    expect(formatQuotationNumber(12345)).toBe("QUO-12345");
  });
});

describe("quotationInput", () => {
  const base = { clientName: "Acme", issueDate: "2026-07-05", validUntil: "2026-08-05", lineItems: [] };
  it("accepts a valid quotation with validUntil", () => {
    expect(quotationInput.safeParse(base).success).toBe(true);
  });
  it("rejects a missing validUntil", () => {
    const { validUntil: _omit, ...rest } = base;
    expect(quotationInput.safeParse(rest).success).toBe(false);
  });
  it("coerces empty clientEmail to null", () => {
    const parsed = quotationInput.parse({ ...base, clientEmail: "" });
    expect(parsed.clientEmail).toBeNull();
  });
});
