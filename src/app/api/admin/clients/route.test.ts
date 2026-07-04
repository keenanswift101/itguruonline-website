import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("POST /api/admin/clients — non-DB guards", () => {
  it.todo("returns 401 when no session cookie is present");
  it.todo("returns 422 when name is empty");
  it.todo("returns 422 when email is malformed");
});

describe("GET /api/admin/clients — non-DB guards", () => {
  it.todo("returns 401 when no session cookie is present");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/clients — DB tests", () => {
  it.todo("creates a client with source=manual and returns 201");
  it.todo("stores empty-string defaults for omitted optional fields");
});
