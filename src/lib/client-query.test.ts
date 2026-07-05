import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("getClientInvoices", () => {
  it.todo("returns invoices linked to the client by client_id, newest first");
  it.todo("returns [] for a client with no linked invoices");
  it.todo("formats the invoice number (DRAFT for unassigned)");
});
