import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let sessionToken: string | null = null;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (sessionToken ? { name, value: sessionToken } : undefined),
  }),
}));
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: vi.fn().mockResolvedValue({ error: null }) } })),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("POST /api/admin/invoices/[id]/resend — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });
  it.todo("returns 401 when no session cookie is present");
  it.todo("returns 400 for a non-numeric id");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("POST /api/admin/invoices/[id]/resend — DB tests", () => {
  it.todo("returns 404 for an unknown invoice id");
  it.todo("returns 409 when the invoice is still a draft (not sent)");
  it.todo("returns 422 (no_client_email) when a sent invoice has no client email");
  it.todo("re-sends the PDF and returns ok without changing status");
});
