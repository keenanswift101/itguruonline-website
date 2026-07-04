import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("POST /api/admin/clients/[id]/notes — non-DB guards", () => {
  it.todo("returns 401 when no session cookie is present");
  it.todo("returns 404 for a non-numeric client id");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/clients/[id]/notes — DB tests", () => {
  it.todo("inserts a crm_notes row with recordType 'client' and returns 201");
  it.todo("strips HTML from the note body before storing");
});
