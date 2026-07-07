import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("PATCH /api/admin/tickets/[id]/status — non-DB guards", () => {
  it.todo("returns 401 when no session cookie is present");
  it.todo("returns 422 for an invalid status enum value when authed");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("PATCH /api/admin/tickets/[id]/status — DB tests", () => {
  it.todo("open→resolved stamps resolved_at and returns ok");
  it.todo("returns 409 for a disallowed transition");
  it.todo("reopening (resolved→open) clears resolved_at");
});
