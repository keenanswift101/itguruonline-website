import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

// Mutable session token — null means "no session cookie present".
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

function makeRequest(id = "1") {
  return new Request(`http://localhost:3000/api/admin/invoices/${id}/pdf`, {
    method: "GET",
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── Non-DB auth guard (always runs — request never reaches the db) ──────────

describe("GET /api/admin/invoices/[id]/pdf — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("401 without session", async () => {
    const { GET } = await import("./route");
    const res = await GET(makeRequest(), params("1"));
    expect(res.status).toBe(401);
  });
});

// ── DB integration (gated) ──────────────────────────────────────────────────

const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describeIfDb("GET /api/admin/invoices/[id]/pdf — DB integration", () => {
  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
  });

  it("200 + application/pdf for a real invoice (DB)", async () => {
    const { db } = await import("@/lib/db/index");
    const { invoices, invoiceLineItems } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [draft] = await db
      .insert(invoices)
      .values({
        clientName: "PDF Test Client",
        clientEmail: "pdf@test.dev",
        billingAddress: "1 Main Rd\nKuils River",
        issueDate: "2026-07-02",
        dueDate: "2026-07-31",
        totalRands: 199,
      })
      .returning();
    await db.insert(invoiceLineItems).values({
      invoiceId: draft.id,
      description: "Business hosting — July",
      quantity: 1,
      unitPriceRands: 199,
      lineTotalRands: 199,
      sortOrder: 0,
    });

    const { GET } = await import("./route");
    const res = await GET(makeRequest(String(draft.id)), params(String(draft.id)));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("Draft-Invoice.pdf");

    const body = new Uint8Array(await res.arrayBuffer());
    expect(body.length).toBeGreaterThan(0);
    // %PDF magic bytes
    expect(String.fromCharCode(...body.slice(0, 4))).toBe("%PDF");

    await db.delete(invoices).where(eq(invoices.id, draft.id));
  });

  it("404 for a missing invoice (DB)", async () => {
    const { GET } = await import("./route");
    const res = await GET(makeRequest("999999"), params("999999"));
    expect(res.status).toBe(404);
  });
});
