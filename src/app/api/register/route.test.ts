import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import type { RegistrationFormData } from "@/lib/registration-types";

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

// Import mocked modules at the top level so we can reference them in tests
import { sendEmail } from "@/lib/email";
import { db } from "@/lib/db/index";
import { POST } from "./route";

// ── Fixture ────────────────────────────────────────────────────────────────
function makeFixture(overrides: Partial<RegistrationFormData> = {}): RegistrationFormData {
  return {
    stepA: {
      firstName: "Test",
      surname: "User",
      physicalAddress: "123 Test Street, Kuils River, Cape Town, 7580",
      postalAddress: "PO Box 1, Kuils River, 7580",
      telephone: "",
      cellPhone: "+27821234567",
      email: `crm-test+${Date.now()}@example.com`,
    },
    stepB: {
      domainName: "testdomain.co.za",
      nameserver1: "",
      nameserver2: "",
    },
    stepC: {
      hostingPackage: "startup",
      domainRegistration: true,
      sslCertificate: false,
      emailHosting: false,
      websiteDesign: false,
      additionalServices: "",
    },
    stepD: {
      termsAccepted: true,
      signature: "Test User",
      signatureDate: new Date().toISOString().split("T")[0],
    },
    ...overrides,
  };
}

function makeRequest(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/register", {
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
describe("POST /api/register — non-DB guards", () => {
  it("rejects cross-site origin with 403", async () => {
    const req = makeRequest(makeFixture(), "https://evil.com");
    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });
});

// ── Ordering tests ─────────────────────────────────────────────────────────
describe("POST /api/register — ordering", () => {
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
    const req = makeRequest(makeFixture());
    const res = await POST(req as any);

    expect(res.status).toBe(201);
    expect(dbInsertMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalled();

    // Verify ordering via invocationCallOrder
    const insertOrder = dbInsertMock.mock.invocationCallOrder[0];
    const emailOrder = sendEmailMock.mock.invocationCallOrder[0];
    expect(insertOrder).toBeLessThan(emailOrder);
  });

  it("still returns 201 with referenceId even when db.insert throws", async () => {
    // Override insert to reject
    dbInsertMock.mockReturnValueOnce({
      values: vi.fn().mockRejectedValueOnce(new Error("DB connection failure")),
    } as any);

    const req = makeRequest(makeFixture());
    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toHaveProperty("referenceId");
    expect(body.referenceId).toMatch(/^ITG-\d{8}-[A-Z0-9]{5}$/);
  });
});

// ── DB-dependent round-trip tests ──────────────────────────────────────────
// These require NETLIFY_DB_URL; run via `netlify dev:exec npm test`
const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/register — DB round-trip", () => {
  beforeAll(() => {
    // The mocked db is still in place for the above tests.
    // In a real-DB environment the mock would be bypassed by providing
    // NETLIFY_DB_URL; these tests are intentionally skipped without it.
  });

  it("inserts a client_registrations row with the returned referenceId", async () => {
    // This test only runs when NETLIFY_DB_URL is present.
    // Import real DB outside the mock context via netlify dev:exec.
    const { db: realDb } = await import("@/lib/db/index");
    const { clientRegistrations } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const req = makeRequest(makeFixture());
    const res = await POST(req as any);
    expect(res.status).toBe(201);

    const { referenceId } = await res.json();
    const rows = await realDb
      .select()
      .from(clientRegistrations)
      .where(eq(clientRegistrations.referenceId, referenceId));

    expect(rows).toHaveLength(1);
    expect(rows[0].referenceId).toBe(referenceId);
    expect(rows[0].status).toBe("new");
  });
});
