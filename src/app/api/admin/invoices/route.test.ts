import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

// Mutable session token — null means "no session cookie present".
// The vi.mock factory closes over this variable so each test controls auth.
let sessionToken: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      sessionToken ? { name, value: sessionToken } : undefined,
  }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
  }
});

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  clientName: "Acme (Pty) Ltd",
  clientEmail: "billing@acme.co.za",
  billingAddress: "1 Main Rd\nKuils River",
  issueDate: "2026-07-02",
  dueDate: "2026-07-31",
  lineItems: [
    { description: "Startup hosting — July", quantity: 1, unitPriceRands: 99 },
    { description: "Domain renewal .co.za", quantity: 2, unitPriceRands: 120 },
  ],
};

// ── Pure helper tests (always run) ──────────────────────────────────────────

describe("src/lib/invoices helpers", () => {
  it("computeTotals multiplies quantity × unitPriceRands per line and sums", async () => {
    const { computeTotals } = await import("@/lib/invoices");
    const { lines, totalRands } = computeTotals([
      { quantity: 2, unitPriceRands: 100 },
      { quantity: 3, unitPriceRands: 50 },
    ]);
    expect(lines[0].lineTotalRands).toBe(200);
    expect(lines[1].lineTotalRands).toBe(150);
    expect(totalRands).toBe(350);
  });

  it("computeTotals returns 0 total for empty line items", async () => {
    const { computeTotals } = await import("@/lib/invoices");
    expect(computeTotals([]).totalRands).toBe(0);
  });

  it("formatInvoiceNumber pads sequence to 3 digits", async () => {
    const { formatInvoiceNumber } = await import("@/lib/invoices");
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-001");
    expect(formatInvoiceNumber(2026, 42)).toBe("INV-2026-042");
    expect(formatInvoiceNumber(2026, 1234)).toBe("INV-2026-1234");
  });

  it("formatInvoiceNumber returns DRAFT when numbering is unassigned", async () => {
    const { formatInvoiceNumber } = await import("@/lib/invoices");
    expect(formatInvoiceNumber(null, null)).toBe("DRAFT");
    expect(formatInvoiceNumber(2026, null)).toBe("DRAFT");
    expect(formatInvoiceNumber(null, 1)).toBe("DRAFT");
  });
});

// ── Non-DB route guards (always run) ────────────────────────────────────────

describe("POST /api/admin/invoices — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("returns 401 without a session cookie", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 even with a valid-shaped body (requireAdmin is first)", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest("not-json") as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 on a non-JSON body when authenticated", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const res = await POST(makeRequest("not-json") as never);
    expect(res.status).toBe(400);
  });

  it("returns 422 with fieldErrors when clientName is missing", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const { clientName: _omit, ...rest } = validBody;
    const res = await POST(makeRequest(rest) as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("Validation failed.");
    expect(body.fields).toHaveProperty("clientName");
  });

  it("returns 422 when dueDate is missing", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const { dueDate: _omit, ...rest } = validBody;
    const res = await POST(makeRequest(rest) as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fields).toHaveProperty("dueDate");
  });
});

// ── DB-dependent tests ──────────────────────────────────────────────────────

const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/invoices — DB integration", () => {
  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
  });

  it("creates a draft invoice + line items with server-computed total (201)", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe("number");

    const { db } = await import("@/lib/db/index");
    const { invoices, invoiceLineItems } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [inv] = await db.select().from(invoices).where(eq(invoices.id, body.id));
    expect(inv).toBeDefined();
    expect(inv.status).toBe("draft");
    expect(inv.totalRands).toBe(1 * 99 + 2 * 120);
    expect(inv.fiscalYear).toBeNull();
    expect(inv.sequenceNumber).toBeNull();

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, body.id));
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.lineTotalRands).sort()).toEqual([99, 240]);

    // cleanup (line items cascade)
    await db.delete(invoices).where(eq(invoices.id, body.id));
  });
});
