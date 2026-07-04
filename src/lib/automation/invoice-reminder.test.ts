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

describe("runInvoiceReminderJob", () => {
  it("sends ONE email PER overdue invoice to ambrose@it-guru.co.za", async () => {
    const { runInvoiceReminderJob } = await import("./invoice-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "1" }]) // site_settings
      .mockResolvedValueOnce([
        {
          id: 1,
          clientName: "Acme (Pty) Ltd",
          clientEmail: "billing@acme.co.za",
          dueDate: "2026-07-01",
          totalRands: 500,
          fiscalYear: 2026,
          sequenceNumber: 1,
          lastRemindedAt: null,
        },
        {
          id: 2,
          clientName: "Beta CC",
          clientEmail: "beta@example.com",
          dueDate: "2026-07-02",
          totalRands: 300,
          fiscalYear: 2026,
          sequenceNumber: 2,
          lastRemindedAt: null,
        },
      ]) // overdue invoices
      .mockResolvedValueOnce([]); // already reminded today

    const result = await runInvoiceReminderJob({ now: NOW, triggeredBy: "manual" });

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail.mock.calls[0][0].to).toBe("ambrose@it-guru.co.za");
    expect(mockSendEmail.mock.calls[0][0].subject).toBe("Overdue Invoice Reminder — INV-2026-001 is overdue");
    expect(mockSendEmail.mock.calls[1][0].subject).toBe("Overdue Invoice Reminder — INV-2026-002 is overdue");
    expect(result).toEqual({ sent: 2, skipped: 0 });
  });

  it("skips invoices already reminded today and reflects them in the skipped count", async () => {
    const { runInvoiceReminderJob } = await import("./invoice-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "1" }])
      .mockResolvedValueOnce([
        {
          id: 1,
          clientName: "Acme (Pty) Ltd",
          clientEmail: "billing@acme.co.za",
          dueDate: "2026-07-01",
          totalRands: 500,
          fiscalYear: 2026,
          sequenceNumber: 1,
          lastRemindedAt: null,
        },
      ])
      .mockResolvedValueOnce([{ id: 5 }]); // 1 already reminded today

    const result = await runInvoiceReminderJob({ now: NOW });

    expect(result).toEqual({ sent: 1, skipped: 1 });
  });

  it("updates lastRemindedAt to today for all reminded invoices after send", async () => {
    const { runInvoiceReminderJob } = await import("./invoice-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "1" }])
      .mockResolvedValueOnce([
        {
          id: 10,
          clientName: "Acme (Pty) Ltd",
          clientEmail: "billing@acme.co.za",
          dueDate: "2026-07-01",
          totalRands: 500,
          fiscalYear: 2026,
          sequenceNumber: 1,
          lastRemindedAt: null,
        },
      ])
      .mockResolvedValueOnce([]);

    await runInvoiceReminderJob({ now: NOW });

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ lastRemindedAt: "2026-07-15" });
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1);
  });

  it("writes an automation_runs row with status success", async () => {
    const { runInvoiceReminderJob } = await import("./invoice-reminder");

    mockWhere
      .mockResolvedValueOnce([{ value: "1" }])
      .mockResolvedValueOnce([
        {
          id: 10,
          clientName: "Acme (Pty) Ltd",
          clientEmail: "billing@acme.co.za",
          dueDate: "2026-07-01",
          totalRands: 500,
          fiscalYear: 2026,
          sequenceNumber: 1,
          lastRemindedAt: null,
        },
      ])
      .mockResolvedValueOnce([]);

    await runInvoiceReminderJob({ now: NOW, triggeredBy: "manual" });

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ jobName: "invoice-reminder", triggeredBy: "manual", status: "success" })
    );
  });

  it("on error, writes an automation_runs row with status error and rethrows", async () => {
    const { runInvoiceReminderJob } = await import("./invoice-reminder");

    mockWhere.mockRejectedValueOnce(new Error("db unreachable"));

    await expect(runInvoiceReminderJob({ now: NOW })).rejects.toThrow("db unreachable");

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ jobName: "invoice-reminder", status: "error", errorMessage: expect.stringContaining("db unreachable") })
    );
  });

  it("returns sent=0 skipped=0 when no invoices are overdue", async () => {
    const { runInvoiceReminderJob } = await import("./invoice-reminder");

    mockWhere.mockResolvedValueOnce([{ value: "1" }]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await runInvoiceReminderJob({ now: NOW });

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, skipped: 0 });
  });
});

describeIfDb("runInvoiceReminderJob (integration)", () => {
  it.todo("end-to-end: selects overdue invoices and marks them reminded");
});
