import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (hoisted) ────────────────────────────────────────────────────────
// Mock email so Resend constructor doesn't run (no RESEND_API_KEY in test env)
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  emailLayout: vi.fn().mockReturnValue("<html></html>"),
  escapeHtml: vi.fn().mockImplementation((s: string) => s),
  ADMIN_EMAIL: "admin@it-guru.co.za",
}));

// Mock DB so no NETLIFY_DB_URL is required for non-DB tests
vi.mock("@/lib/db/index", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    }),
  },
}));

// Import mocked modules at the top level
import { sendEmail } from "@/lib/email";
import { db } from "@/lib/db/index";
import { POST } from "./route";

// ── Fixture ────────────────────────────────────────────────────────────────
function makeContactFixture(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test User",
    email: `crm-test+${Date.now()}@example.com`,
    subject: "General Enquiry",
    message: "This is a test message that is at least 10 characters long.",
    ...overrides,
  };
}

function makeRequest(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

// ── Non-DB guard tests (always run) ───────────────────────────────────────
describe("POST /api/contact — non-DB guards", () => {
  it("rejects cross-site origin with 403", async () => {
    const req = makeRequest(makeContactFixture(), "https://evil.com");
    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it("rejects missing message with 422", async () => {
    const req = makeRequest({ name: "Test", email: "test@example.com", subject: "Hello", message: "" });
    const res = await POST(req as any);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fields).toHaveProperty("message");
  });
});

// ── Ordering tests ─────────────────────────────────────────────────────────
describe("POST /api/contact — ordering", () => {
  const sendEmailMock = vi.mocked(sendEmail);
  const dbInsertMock = vi.mocked(db.insert);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset insert mock to the default success behaviour
    dbInsertMock.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    } as any);
    sendEmailMock.mockResolvedValue(undefined as any);
  });

  it("calls db.insert before sendEmail on a valid submission", async () => {
    const req = makeRequest(makeContactFixture());
    const res = await POST(req as any);

    expect(res.status).toBe(200);
    expect(dbInsertMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalled();

    // Verify ordering via invocationCallOrder
    const insertOrder = dbInsertMock.mock.invocationCallOrder[0];
    const emailOrder = sendEmailMock.mock.invocationCallOrder[0];
    expect(insertOrder).toBeLessThan(emailOrder);
  });

  it("still returns 200 even when db.insert throws", async () => {
    // Override insert to reject
    dbInsertMock.mockReturnValueOnce({
      values: vi.fn().mockRejectedValueOnce(new Error("DB connection failure")),
    } as any);

    const req = makeRequest(makeContactFixture());
    const res = await POST(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("message");
  });

  it("inserts with null phone when phone is not provided", async () => {
    const req = makeRequest(makeContactFixture()); // no phone field
    await POST(req as any);

    const valuesCall = (dbInsertMock.mock.results[0]?.value as any)?.values;
    if (valuesCall) {
      const insertedValues = vi.mocked(valuesCall).mock.calls[0]?.[0];
      expect(insertedValues?.phone).toBeNull();
    }
  });
});

// ── DB-dependent round-trip tests ──────────────────────────────────────────
// These require NETLIFY_DB_URL; run via `netlify dev:exec npm test`
const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/contact — DB round-trip", () => {
  it("inserts a contact_enquiries row with matching name/email/subject/message", async () => {
    const { db: realDb } = await import("@/lib/db/index");
    const { contactEnquiries } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const fixture = makeContactFixture();
    const req = makeRequest(fixture);
    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const rows = await realDb
      .select()
      .from(contactEnquiries)
      .where(eq(contactEnquiries.email, fixture.email as string));

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(fixture.name);
    expect(rows[0].subject).toBe(fixture.subject);
    expect(rows[0].message).toBe(fixture.message);
    expect(rows[0].status).toBe("new");
  });
});
