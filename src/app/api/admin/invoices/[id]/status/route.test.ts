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

function makeRequest(body?: unknown, id = "1") {
  return new Request(`http://localhost:3000/api/admin/invoices/${id}/status`, {
    method: "PATCH",
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

// ── Non-DB auth guard (always runs — request never reaches the db) ──────────

describe("PATCH /api/admin/invoices/[id]/status — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("401 without session", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "sent" }) as never, params("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});

// ── Transition validation with mocked db (always runs) ──────────────────────

let selectRows: Array<{ status: string; issueDate: string }> = [];

describe("PATCH /api/admin/invoices/[id]/status — transitions (mocked db)", () => {
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

  it("400 for a non-numeric id", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(
      makeRequest({ status: "sent" }, "abc") as never,
      params("abc")
    );
    expect(res.status).toBe(400);
  });

  it("400 for a non-JSON body", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest("not-json") as never, params("1"));
    expect(res.status).toBe(400);
  });

  it("422 for an invalid status value", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(
      makeRequest({ status: "overdue" }) as never,
      params("1")
    );
    expect(res.status).toBe(422);
  });

  it("404 when the invoice does not exist", async () => {
    selectRows = [];
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "sent" }) as never, params("1"));
    expect(res.status).toBe(404);
  });

  it("409 on invalid transition (draft→paid)", async () => {
    selectRows = [{ status: "draft", issueDate: "2026-07-02" }];
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "paid" }) as never, params("1"));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Invalid status transition.");
  });

  it("409 on duplicate transition (sent→sent)", async () => {
    selectRows = [{ status: "sent", issueDate: "2026-07-02" }];
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "sent" }) as never, params("1"));
    expect(res.status).toBe(409);
  });

  it("409 on invalid transition (paid→draft)", async () => {
    selectRows = [{ status: "paid", issueDate: "2026-07-02" }];
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "draft" }) as never, params("1"));
    expect(res.status).toBe(409);
  });
});

// ── DB integration (gated) ──────────────────────────────────────────────────

const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describeIfDb("PATCH /api/admin/invoices/[id]/status — DB integration", () => {
  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
  });

  it("assigns fiscal_year+sequence_number on draft→sent (DB)", async () => {
    const { db } = await import("@/lib/db/index");
    const { invoices } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [draft] = await db
      .insert(invoices)
      .values({
        clientName: "Numbering Test",
        issueDate: "2026-07-02",
        dueDate: "2026-07-31",
        totalRands: 100,
      })
      .returning();

    const { PATCH } = await import("./route");
    const res = await PATCH(
      makeRequest({ status: "sent" }, String(draft.id)) as never,
      params(String(draft.id))
    );
    expect(res.status).toBe(200);

    const [updated] = await db.select().from(invoices).where(eq(invoices.id, draft.id));
    expect(updated.status).toBe("sent");
    expect(updated.fiscalYear).toBe(2026);
    expect(updated.sequenceNumber).not.toBeNull();
    expect(updated.sequenceNumber! >= 1).toBe(true);

    await db.delete(invoices).where(eq(invoices.id, draft.id));
  });

  it("sets paid_at on →paid (DB)", async () => {
    const { db } = await import("@/lib/db/index");
    const { invoices } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [sent] = await db
      .insert(invoices)
      .values({
        clientName: "Paid Test",
        issueDate: "2026-07-02",
        dueDate: "2026-07-31",
        status: "sent",
        fiscalYear: 2026,
        sequenceNumber: 998,
        totalRands: 100,
      })
      .returning();

    const { PATCH } = await import("./route");
    const res = await PATCH(
      makeRequest({ status: "paid" }, String(sent.id)) as never,
      params(String(sent.id))
    );
    expect(res.status).toBe(200);

    const [updated] = await db.select().from(invoices).where(eq(invoices.id, sent.id));
    expect(updated.status).toBe("paid");
    expect(updated.paidAt).not.toBeNull();

    await db.delete(invoices).where(eq(invoices.id, sent.id));
  });

  it("409 on invalid transition against a real draft row (DB)", async () => {
    const { db } = await import("@/lib/db/index");
    const { invoices } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [draft] = await db
      .insert(invoices)
      .values({
        clientName: "Invalid Transition Test",
        issueDate: "2026-07-02",
        dueDate: "2026-07-31",
        totalRands: 100,
      })
      .returning();

    const { PATCH } = await import("./route");
    const res = await PATCH(
      makeRequest({ status: "paid" }, String(draft.id)) as never,
      params(String(draft.id))
    );
    expect(res.status).toBe(409);

    await db.delete(invoices).where(eq(invoices.id, draft.id));
  });
});
