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

const HEADER_ROW =
  "Invoice #,Client Name,Client Email,Issue Date,Due Date,Total (R),Status,Paid At";

function makeRequest(query = "") {
  return new Request(`http://localhost:3000/api/admin/invoices/csv${query}`, {
    method: "GET",
  });
}

// ── Non-DB auth guard (always runs) ─────────────────────────────────────────

describe("GET /api/admin/invoices/csv — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("401 without session", async () => {
    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
});

// ── CSV format with mocked db (always runs) ─────────────────────────────────

let mockRows: Array<Record<string, unknown>> = [];

describe("GET /api/admin/invoices/csv — format (mocked db)", () => {
  beforeAll(() => {
    vi.resetModules();
    vi.doMock("@/lib/db/index", () => {
      const chain = {
        where: () => chain,
        orderBy: async () => mockRows,
      };
      return {
        db: {
          select: () => ({ from: () => chain }),
        },
      };
    });
  });

  afterAll(() => {
    vi.doUnmock("@/lib/db/index");
    vi.resetModules();
  });

  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    mockRows = [];
  });

  it("Content-Type text/csv + attachment disposition", async () => {
    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="invoices.csv"'
    );
  });

  it("header row matches spec exactly", async () => {
    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.text();
    expect(body.split("\n")[0]).toBe(HEADER_ROW);
  });

  it("escapes commas/quotes in client fields and formats the invoice number", async () => {
    mockRows = [
      {
        clientName: 'Acme, "The Best" (Pty) Ltd',
        clientEmail: "billing@acme.co.za",
        issueDate: "2026-07-02",
        dueDate: "2026-07-31",
        status: "sent",
        fiscalYear: 2026,
        sequenceNumber: 7,
        totalRands: 1500,
        paidAt: null,
      },
      {
        clientName: "Draft Client",
        clientEmail: null,
        issueDate: "2026-07-02",
        dueDate: "2026-07-31",
        status: "draft",
        fiscalYear: null,
        sequenceNumber: null,
        totalRands: 0,
        paidAt: null,
      },
    ];
    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const lines = (await res.text()).split("\n");
    expect(lines[1]).toBe(
      'INV-2026-007,"Acme, ""The Best"" (Pty) Ltd",billing@acme.co.za,2026-07-02,2026-07-31,1500,sent,'
    );
    expect(lines[2]).toBe("DRAFT,Draft Client,,2026-07-02,2026-07-31,0,draft,");
  });
});

// ── DB integration (gated) ──────────────────────────────────────────────────

const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describeIfDb("GET /api/admin/invoices/csv — DB integration", () => {
  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
  });

  it("?status=sent filters rows to that status (DB)", async () => {
    const { db } = await import("@/lib/db/index");
    const { invoices } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [draft] = await db
      .insert(invoices)
      .values({
        clientName: "CSV Filter Draft",
        issueDate: "2026-07-02",
        dueDate: "2026-07-31",
        totalRands: 10,
      })
      .returning();

    const { GET } = await import("./route");
    const res = await GET(makeRequest("?status=sent"));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).not.toContain("CSV Filter Draft");

    const resAll = await GET(makeRequest());
    expect(await resAll.text()).toContain("CSV Filter Draft");

    await db.delete(invoices).where(eq(invoices.id, draft.id));
  });
});
