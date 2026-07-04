import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("POST /api/admin/crm/[id]/convert — non-DB guards", () => {
  it.todo("returns 401 when no session cookie is present");
  it.todo("returns 404 for an unparseable crm id");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/crm/[id]/convert — DB tests", () => {
  it.todo("maps registration firstName+surname into client.name and copies addresses");
  it.todo("maps enquiry name/email/phone into the client");
  it.todo("stamps converted_client_id on the lead inside one transaction");
  it.todo("returns 409 when the lead was already converted (idempotent)");
});
