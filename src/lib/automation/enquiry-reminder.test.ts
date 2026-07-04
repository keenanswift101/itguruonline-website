import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockWhere, mockSelect, mockInsertValues, mockInsert, mockUpdateWhere, mockUpdateSet, mockUpdate, mockSendEmail } =
  vi.hoisted(() => {
    const mockWhere = vi.fn();
    const mockSelect = vi.fn(() => ({ from: vi.fn(() => ({ where: mockWhere })) }));
    const mockInsertValues = vi.fn().mockResolvedValue(undefined);
    const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
    const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
    const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));
    const mockSendEmail = vi.fn().mockResolvedValue(undefined);
    return { mockWhere, mockSelect, mockInsertValues, mockInsert, mockUpdateWhere, mockUpdateSet, mockUpdate, mockSendEmail };
  });

vi.mock("@/lib/db/index", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
  emailLayout: (title: string, bodyHtml: string) => `<html><body>${title}${bodyHtml}</body></html>`,
  escapeHtml: (v: string) => v,
}));

vi.mock("resend");

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

const NOW = new Date("2026-07-15T10:00:00.000Z");

beforeEach(() => {
  mockWhere.mockReset();
  mockSelect.mockClear();
  mockInsertValues.mockClear();
  mockInsertValues.mockResolvedValue(undefined);
  mockUpdateWhere.mockClear();
  mockUpdateWhere.mockResolvedValue(undefined);
  mockUpdateSet.mockClear();
  mockSendEmail.mockClear();
  mockSendEmail.mockResolvedValue(undefined);
});

describe("runEnquiryReminderJob", () => {
  it("sends ONE summary email to ambrose@it-guru.co.za listing all stale enquiries", async () => {
    const { runEnquiryReminderJob } = await import("./enquiry-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "7" }]) // site_settings
      .mockResolvedValueOnce([
        { id: 1, name: "Alice", updatedAt: new Date("2026-07-01T00:00:00.000Z"), lastRemindedAt: null },
        { id: 2, name: "Bob", updatedAt: new Date("2026-06-20T00:00:00.000Z"), lastRemindedAt: null },
        { id: 3, name: "Carla", updatedAt: new Date("2026-06-01T00:00:00.000Z"), lastRemindedAt: null },
      ]) // stale enquiries
      .mockResolvedValueOnce([]); // already reminded today

    const result = await runEnquiryReminderJob({ now: NOW, triggeredBy: "manual" });

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe("ambrose@it-guru.co.za");
    expect(call.subject).toBe("Stale Enquiry Reminder — 3 enquiry(ies) need attention");
    expect(result).toEqual({ sent: 1, skipped: 0 });
  });

  it("skips enquiries already reminded today and reflects them in the skipped count", async () => {
    const { runEnquiryReminderJob } = await import("./enquiry-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "7" }])
      .mockResolvedValueOnce([{ id: 1, name: "Alice", updatedAt: new Date("2026-07-01T00:00:00.000Z"), lastRemindedAt: null }])
      .mockResolvedValueOnce([{ id: 2 }, { id: 3 }]); // 2 already reminded today

    const result = await runEnquiryReminderJob({ now: NOW });

    expect(result).toEqual({ sent: 1, skipped: 2 });
  });

  it("does NOT send email when 0 stale enquiries found", async () => {
    const { runEnquiryReminderJob } = await import("./enquiry-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "7" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await runEnquiryReminderJob({ now: NOW });

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, skipped: 0 });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ jobName: "enquiry-reminder", status: "success", resultSummary: "0 stale enquiries" })
    );
  });

  it("updates lastRemindedAt to today for all reminded records after send", async () => {
    const { runEnquiryReminderJob } = await import("./enquiry-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "7" }])
      .mockResolvedValueOnce([
        { id: 10, name: "Alice", updatedAt: new Date("2026-07-01T00:00:00.000Z"), lastRemindedAt: null },
        { id: 20, name: "Bob", updatedAt: new Date("2026-06-20T00:00:00.000Z"), lastRemindedAt: null },
      ])
      .mockResolvedValueOnce([]);

    await runEnquiryReminderJob({ now: NOW });

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ lastRemindedAt: "2026-07-15" });
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1);
  });

  it("writes an automation_runs row with jobName and triggeredBy on success", async () => {
    const { runEnquiryReminderJob } = await import("./enquiry-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "7" }])
      .mockResolvedValueOnce([{ id: 1, name: "Alice", updatedAt: new Date("2026-07-01T00:00:00.000Z"), lastRemindedAt: null }])
      .mockResolvedValueOnce([]);

    await runEnquiryReminderJob({ now: NOW, triggeredBy: "manual" });

    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ jobName: "enquiry-reminder", triggeredBy: "manual", status: "success" })
    );
  });

  it("on error, writes an automation_runs row with status error and rethrows", async () => {
    const { runEnquiryReminderJob } = await import("./enquiry-reminder");

    mockWhere.mockRejectedValueOnce(new Error("db unreachable"));

    await expect(runEnquiryReminderJob({ now: NOW })).rejects.toThrow("db unreachable");

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ jobName: "enquiry-reminder", status: "error", errorMessage: expect.stringContaining("db unreachable") })
    );
  });
});

describeIfDb("runEnquiryReminderJob (integration)", () => {
  it.todo("end-to-end: selects stale records and marks them reminded");
});
