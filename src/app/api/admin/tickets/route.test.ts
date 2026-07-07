import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("POST /api/admin/tickets — non-DB guards", () => {
  it.todo("returns 401 when no session cookie is present");
  it.todo("returns 422 when subject is empty");
  it.todo("returns 422 when clientId is missing");
});

describe("GET /api/admin/tickets — non-DB guards", () => {
  it.todo("returns 401 when no session cookie is present");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/tickets — DB tests", () => {
  it.todo("creates a ticket linked to a client with status=open and returns 201");
  it.todo("returns 422 when clientId does not exist");
});

describeIfDb("GET /api/admin/tickets — DB tests", () => {
  it.todo("orders open/in_progress before resolved, then priority high→low");
  it.todo("filters by ?status=open");
});
