import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("GET/PUT /api/admin/clients/[id] — non-DB guards", () => {
  it.todo("GET returns 401 when no session cookie is present");
  it.todo("PUT returns 401 when no session cookie is present");
  it.todo("PUT returns 400 for a non-numeric id");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("GET/PUT /api/admin/clients/[id] — DB tests", () => {
  it.todo("GET returns 404 for an unknown id");
  it.todo("PUT persists edited fields and returns ok");
});
