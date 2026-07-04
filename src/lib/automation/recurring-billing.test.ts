import { vi, describe, it, expect, beforeEach } from "vitest";
import { invoiceLineItems } from "@/lib/db/schema";

const {
  mockSelectWhere,
  mockDbInsertValues,
  mockDbInsert,
  invoiceValuesMock,
  lineItemValuesMock,
  invoiceReturningQueue,
  mockTxInsert,
  mockWithTxDb,
} = vi.hoisted(() => {
  const mockSelectWhere = vi.fn();

  const mockDbInsertValues = vi.fn().mockResolvedValue(undefined);
  const mockDbInsert = vi.fn(() => ({ values: mockDbInsertValues }));

  const invoiceReturningQueue: unknown[][] = [];
  const invoiceValuesMock = vi.fn(() => ({
    onConflictDoNothing: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve(invoiceReturningQueue.shift() ?? [])),
    })),
  }));
  const lineItemValuesMock = vi.fn().mockResolvedValue(undefined);

  const mockTxInsert = vi.fn((table: unknown) => {
    if (table === invoiceLineItems) return { values: lineItemValuesMock };
    return { values: invoiceValuesMock };
  });

  const fakeTx = { insert: mockTxInsert };
  const fakeTxDb = { transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(fakeTx)) };
  const mockWithTxDb = vi.fn((fn: (db: unknown) => unknown) => fn(fakeTxDb));

  return {
    mockSelectWhere,
    mockDbInsertValues,
    mockDbInsert,
    invoiceValuesMock,
    lineItemValuesMock,
    invoiceReturningQueue,
    mockTxInsert,
    mockWithTxDb,
  };
});

vi.mock("@/lib/db/index", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({ where: mockSelectWhere })),
      })),
    })),
    insert: mockDbInsert,
  },
}));

vi.mock("@/lib/db/tx", () => ({
  withTxDb: mockWithTxDb,
}));

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

const NOW = new Date(2026, 6, 15); // July 15 2026, local — safely mid-month

beforeEach(() => {
  mockSelectWhere.mockReset();
  mockDbInsertValues.mockClear();
  mockDbInsertValues.mockResolvedValue(undefined);
  mockDbInsert.mockClear();
  invoiceValuesMock.mockClear();
  lineItemValuesMock.mockClear();
  lineItemValuesMock.mockResolvedValue(undefined);
  invoiceReturningQueue.length = 0;
  mockTxInsert.mockClear();
  mockWithTxDb.mockClear();
});

const EXPECTED_PERIOD_START = new Date(NOW.getFullYear(), NOW.getMonth(), 1).toISOString().slice(0, 10);

describe("runRecurringBillingJob", () => {
  it("inserts a draft invoice with billingPeriodStart = 1st of current month", async () => {
    const { runRecurringBillingJob } = await import("./recurring-billing");

    mockSelectWhere.mockResolvedValueOnce([
      { scheduleId: 1, clientName: "Acme (Pty) Ltd", clientEmail: "billing@acme.co.za", packageId: 2, packageName: "Startup", packagePriceRands: 99 },
    ]);
    invoiceReturningQueue.push([{ id: 55 }]);

    const result = await runRecurringBillingJob({ now: NOW, triggeredBy: "manual" });

    expect(result).toEqual({ inserted: 1, skipped: 0 });
    expect(invoiceValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "draft",
        billingPeriodStart: EXPECTED_PERIOD_START,
        clientName: "Acme (Pty) Ltd",
        billingScheduleId: 1,
        totalRands: 99,
      })
    );
  });

  it("inserts an invoice_line_items row with the package description and price", async () => {
    const { runRecurringBillingJob } = await import("./recurring-billing");

    mockSelectWhere.mockResolvedValueOnce([
      { scheduleId: 1, clientName: "Acme (Pty) Ltd", clientEmail: "billing@acme.co.za", packageId: 2, packageName: "Startup", packagePriceRands: 99 },
    ]);
    invoiceReturningQueue.push([{ id: 55 }]);

    await runRecurringBillingJob({ now: NOW });

    expect(lineItemValuesMock).toHaveBeenCalledWith({
      invoiceId: 55,
      description: "Startup – monthly hosting",
      quantity: 1,
      unitPriceRands: 99,
      lineTotalRands: 99,
      sortOrder: 1,
    });
  });

  it("is idempotent — a second call for a period that already has an invoice returns inserted=0", async () => {
    const { runRecurringBillingJob } = await import("./recurring-billing");

    mockSelectWhere.mockResolvedValueOnce([
      { scheduleId: 1, clientName: "Acme (Pty) Ltd", clientEmail: "billing@acme.co.za", packageId: 2, packageName: "Startup", packagePriceRands: 99 },
    ]);
    // ON CONFLICT DO NOTHING -> empty array returned, no row inserted
    invoiceReturningQueue.push([]);

    const result = await runRecurringBillingJob({ now: NOW });

    expect(result).toEqual({ inserted: 0, skipped: 1 });
    expect(lineItemValuesMock).not.toHaveBeenCalled();
  });

  it("returns inserted=0 skipped=0 and writes automation_runs when there are no active schedules", async () => {
    const { runRecurringBillingJob } = await import("./recurring-billing");

    mockSelectWhere.mockResolvedValueOnce([]);

    const result = await runRecurringBillingJob({ now: NOW, triggeredBy: "manual" });

    expect(result).toEqual({ inserted: 0, skipped: 0 });
    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ jobName: "recurring-billing", status: "success", resultSummary: "0 active billing schedules" })
    );
  });

  it("writes an automation_runs row with jobName recurring-billing and a summary of inserted/skipped counts", async () => {
    const { runRecurringBillingJob } = await import("./recurring-billing");

    mockSelectWhere.mockResolvedValueOnce([
      { scheduleId: 1, clientName: "Acme (Pty) Ltd", clientEmail: "billing@acme.co.za", packageId: 2, packageName: "Startup", packagePriceRands: 99 },
      { scheduleId: 2, clientName: "Beta CC", clientEmail: null, packageId: 3, packageName: "Business", packagePriceRands: 199 },
    ]);
    invoiceReturningQueue.push([{ id: 1 }], []);

    const result = await runRecurringBillingJob({ now: NOW, triggeredBy: "manual" });

    expect(result).toEqual({ inserted: 1, skipped: 1 });
    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        jobName: "recurring-billing",
        triggeredBy: "manual",
        status: "success",
        resultSummary: expect.stringContaining("Inserted 1 invoice(s), skipped 1"),
      })
    );
  });

  it("on error, writes an automation_runs row with status error and rethrows", async () => {
    const { runRecurringBillingJob } = await import("./recurring-billing");

    mockSelectWhere.mockRejectedValueOnce(new Error("db unreachable"));

    await expect(runRecurringBillingJob({ now: NOW })).rejects.toThrow("db unreachable");

    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ jobName: "recurring-billing", status: "error", errorMessage: expect.stringContaining("db unreachable") })
    );
  });
});

describeIfDb("runRecurringBillingJob (integration)", () => {
  it.todo("end-to-end: idempotency confirmed against real DB unique constraint");
});
