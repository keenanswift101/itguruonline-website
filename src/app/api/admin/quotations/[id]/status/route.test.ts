import { describe, it, beforeAll, beforeEach, vi } from "vitest";

let sessionToken: string | null = null;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (sessionToken ? { name, value: sessionToken } : undefined) }),
}));
// Resend mock MUST be a `function` (not arrow) — vitest calls it via `new Resend()` (08-04 lesson).
vi.mock("resend", () => ({
  Resend: vi.fn(function () { return { emails: { send: vi.fn().mockResolvedValue({ error: null }) } }; }),
}));

beforeAll(() => { if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!"; });

describe("PATCH /api/admin/quotations/[id]/status — non-DB guards", () => {
  beforeEach(() => { sessionToken = null; });
  it.todo("returns 401 without a session cookie");
  it.todo("returns 400 for a non-numeric id / malformed body");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("PATCH /api/admin/quotations/[id]/status — DB tests", () => {
  it.todo("draft→sent returns 422 no_client_email when clientEmail null");
  it.todo("draft→sent emails the PDF + sets status sent");
  it.todo("sent→accepted ok");
  it.todo("accepted→sent returns 409 (terminal)");
});
