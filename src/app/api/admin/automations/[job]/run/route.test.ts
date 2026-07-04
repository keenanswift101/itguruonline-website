import { vi, describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";

// Mock all dependencies. "resend" is auto-mocked too, since automocking the
// job modules below still loads their real module graph (which imports
// src/lib/email.ts -> `new Resend(process.env.RESEND_API_KEY)` at module
// scope) to introspect exports before replacing them with vi.fn() stubs —
// without this, the real Resend constructor throws "Missing API key" in test.
vi.mock("resend");
vi.mock("@/lib/auth");
vi.mock("@/lib/automation/enquiry-reminder");
vi.mock("@/lib/automation/invoice-reminder");
vi.mock("@/lib/automation/recurring-billing");

import { requireAdmin } from "@/lib/auth";
import { runEnquiryReminderJob } from "@/lib/automation/enquiry-reminder";
import { runInvoiceReminderJob } from "@/lib/automation/invoice-reminder";
import { runRecurringBillingJob } from "@/lib/automation/recurring-billing";

function makeRequest(job: string) {
  const req = new Request(`http://localhost/api/admin/automations/${job}/run`, {
    method: "POST",
  }) as unknown as import("next/server").NextRequest;
  const params = Promise.resolve({ job });
  return { req, params };
}

describe("POST /api/admin/automations/[job]/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(null);
    const { req, params } = makeRequest("enquiry-reminder");
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 for unknown job name bad-job", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ sub: "1", email: "admin@test.com" });
    const { req, params } = makeRequest("bad-job");
    const res = await POST(req, { params });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Unknown job");
  });

  it("returns 200 with summary for enquiry-reminder", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ sub: "1", email: "admin@test.com" });
    vi.mocked(runEnquiryReminderJob).mockResolvedValue({ sent: 1, skipped: 0 });
    const { req, params } = makeRequest("enquiry-reminder");
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toEqual({ sent: 1, skipped: 0 });
    expect(runEnquiryReminderJob).toHaveBeenCalledWith({ triggeredBy: "manual" });
  });

  it("returns 200 with summary for invoice-reminder", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ sub: "1", email: "admin@test.com" });
    vi.mocked(runInvoiceReminderJob).mockResolvedValue({ sent: 2, skipped: 1 });
    const { req, params } = makeRequest("invoice-reminder");
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toEqual({ sent: 2, skipped: 1 });
    expect(runInvoiceReminderJob).toHaveBeenCalledWith({ triggeredBy: "manual" });
  });

  it("returns 200 with summary for recurring-billing", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ sub: "1", email: "admin@test.com" });
    vi.mocked(runRecurringBillingJob).mockResolvedValue({ inserted: 3, skipped: 0 });
    const { req, params } = makeRequest("recurring-billing");
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toEqual({ inserted: 3, skipped: 0 });
    expect(runRecurringBillingJob).toHaveBeenCalledWith({ triggeredBy: "manual" });
  });

  it("returns 500 when job function throws", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ sub: "1", email: "admin@test.com" });
    vi.mocked(runEnquiryReminderJob).mockRejectedValue(new Error("DB connection failed"));
    const { req, params } = makeRequest("enquiry-reminder");
    const res = await POST(req, { params });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    // Response must NOT leak internal error details (security-audit fix);
    // the real error goes to server logs only.
    expect(body.error).not.toContain("DB connection failed");
    expect(body.error).toBe("Job failed — check function logs.");
  });
});
