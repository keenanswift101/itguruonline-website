import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";

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

const validBody = {
  clientName: "Acme (Pty) Ltd",
  clientEmail: "billing@acme.co.za",
  billingAddress: "1 Main Rd\nKuils River",
  issueDate: "2026-07-02",
  dueDate: "2026-07-31",
  lineItems: [
    { description: "Business hosting — July", quantity: 1, unitPriceRands: 199 },
  ],
};

function makeRequest(method: "PUT" | "DELETE", body?: unknown, id = "1") {
  return new Request(`http://localhost:3000/api/admin/invoices/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── Non-DB auth guards (always run, real db module — never reached) ─────────

describe("PUT/DELETE /api/admin/invoices/[id] — auth guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("PUT returns 401 without a session cookie", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", validBody) as never, params("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("DELETE returns 401 without a session cookie", async () => {
    const { DELETE } = await import("./route");
    const res = await DELETE(makeRequest("DELETE") as never, params("1"));
    expect(res.status).toBe(401);
  });
});

// ── 409 edit lock + validation (mocked db, always run) ──────────────────────
// The db select is mocked so these security-critical tests run without a DB.

let selectRows: Array<{ status: string }> = [];

describe("PUT/DELETE /api/admin/invoices/[id] — draft lock (mocked db)", () => {
  beforeAll(() => {
    vi.resetModules();
    vi.doMock("@/lib/db/index", () => ({
      db: {
        select: () => ({
          from: () => ({ where: async () => selectRows }),
        }),
      },
    }));
  });

  afterAll(() => {
    vi.doUnmock("@/lib/db/index");
    vi.resetModules();
  });

  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    selectRows = [];
  });

  it("PUT returns 400 for a non-numeric id", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", validBody, "abc") as never, params("abc"));
    expect(res.status).toBe(400);
  });

  it("PUT returns 400 for a non-JSON body", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", "not-json") as never, params("1"));
    expect(res.status).toBe(400);
  });

  it("PUT returns 422 for invalid fields", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(
      makeRequest("PUT", { ...validBody, dueDate: "31/07/2026" }) as never,
      params("1")
    );
    expect(res.status).toBe(422);
  });

  it("PUT returns 404 when the invoice does not exist", async () => {
    selectRows = [];
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", validBody) as never, params("1"));
    expect(res.status).toBe(404);
  });

  it("PUT returns 409 (not 400/422) when invoice status is 'sent' — INVOICE-02 lock", async () => {
    selectRows = [{ status: "sent" }];
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", validBody) as never, params("1"));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Only draft invoices can be edited.");
  });

  it("PUT returns 409 when invoice status is 'paid'", async () => {
    selectRows = [{ status: "paid" }];
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", validBody) as never, params("1"));
    expect(res.status).toBe(409);
  });

  it("DELETE returns 409 when invoice status is 'sent'", async () => {
    selectRows = [{ status: "sent" }];
    const { DELETE } = await import("./route");
    const res = await DELETE(makeRequest("DELETE") as never, params("1"));
    expect(res.status).toBe(409);
  });

  it("DELETE returns 404 when the invoice does not exist", async () => {
    selectRows = [];
    const { DELETE } = await import("./route");
    const res = await DELETE(makeRequest("DELETE") as never, params("1"));
    expect(res.status).toBe(404);
  });
});

// ── DB integration (gated) ──────────────────────────────────────────────────

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("PUT/DELETE /api/admin/invoices/[id] — DB integration", () => {
  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
  });

  it("PUT replaces a draft's fields + line items and recomputes totalRands", async () => {
    const { db } = await import("@/lib/db/index");
    const { invoices, invoiceLineItems } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [draft] = await db
      .insert(invoices)
      .values({
        clientName: "Before Edit",
        issueDate: "2026-07-01",
        dueDate: "2026-07-15",
        totalRands: 50,
      })
      .returning();

    const { PUT } = await import("./route");
    const newBody = {
      ...validBody,
      clientName: "After Edit",
      lineItems: [
        { description: "Line A", quantity: 2, unitPriceRands: 100 },
        { description: "Line B", quantity: 1, unitPriceRands: 55 },
      ],
    };
    const res = await PUT(
      makeRequest("PUT", newBody, String(draft.id)) as never,
      params(String(draft.id))
    );
    expect(res.status).toBe(200);

    const [updated] = await db.select().from(invoices).where(eq(invoices.id, draft.id));
    expect(updated.clientName).toBe("After Edit");
    expect(updated.totalRands).toBe(2 * 100 + 1 * 55);

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, draft.id));
    expect(items).toHaveLength(2);

    await db.delete(invoices).where(eq(invoices.id, draft.id));
  });

  it("PUT returns 409 against a real non-draft row", async () => {
    const { db } = await import("@/lib/db/index");
    const { invoices } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [sent] = await db
      .insert(invoices)
      .values({
        clientName: "Sent Invoice",
        issueDate: "2026-07-01",
        dueDate: "2026-07-15",
        status: "sent",
        fiscalYear: 2026,
        sequenceNumber: 999,
        totalRands: 100,
      })
      .returning();

    const { PUT } = await import("./route");
    const res = await PUT(
      makeRequest("PUT", validBody, String(sent.id)) as never,
      params(String(sent.id))
    );
    expect(res.status).toBe(409);

    await db.delete(invoices).where(eq(invoices.id, sent.id));
  });

  it("DELETE removes a draft and cascades its line items", async () => {
    const { db } = await import("@/lib/db/index");
    const { invoices, invoiceLineItems } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [draft] = await db
      .insert(invoices)
      .values({
        clientName: "To Delete",
        issueDate: "2026-07-01",
        dueDate: "2026-07-15",
        totalRands: 10,
      })
      .returning();
    await db.insert(invoiceLineItems).values({
      invoiceId: draft.id,
      description: "orphan check",
      quantity: 1,
      unitPriceRands: 10,
      lineTotalRands: 10,
      sortOrder: 0,
    });

    const { DELETE } = await import("./route");
    const res = await DELETE(
      makeRequest("DELETE", undefined, String(draft.id)) as never,
      params(String(draft.id))
    );
    expect(res.status).toBe(200);

    const remaining = await db.select().from(invoices).where(eq(invoices.id, draft.id));
    expect(remaining).toHaveLength(0);
    const orphans = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, draft.id));
    expect(orphans).toHaveLength(0);
  });

  it.todo("persists an edited clientId on a draft invoice");
  it.todo("keeps client_id NULL for a free-text edit");
});
