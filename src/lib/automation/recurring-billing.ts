import { db } from "@/lib/db/index";
import { withTxDb } from "@/lib/db/tx";
import { billingSchedules, hostingPackages, invoices, invoiceLineItems, automationRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface RecurringBillingResult {
  inserted: number;
  skipped: number;
}

/**
 * AUTOMATE-03 — recurring billing job.
 *
 * For every active billing schedule, creates a Draft invoice (never "sent")
 * for the current calendar month, with one line item for the client's
 * hosting package. Idempotent: `invoices_recurring_unique(billing_schedule_id,
 * billing_period_start)` + `onConflictDoNothing()` means re-running this job
 * for a month that already has an invoice inserts 0 rows.
 *
 * The invoice + line item insert is written atomically via `withTxDb` — the
 * neon-http driver used by the default `db` export cannot run transactions
 * (drizzle-orm 0.45.2), so a two-statement write like this must go through
 * the short-lived WebSocket client in src/lib/db/tx.ts (same pattern as
 * Phase 4's POST /api/admin/invoices).
 */
export async function runRecurringBillingJob(
  opts?: { triggeredBy?: string; now?: Date }
): Promise<RecurringBillingResult> {
  const now = opts?.now ?? new Date();
  const triggeredBy = opts?.triggeredBy ?? "scheduled";

  // billingPeriodStart = 1st of the current month
  const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const billingPeriodStartStr = billingPeriodStart.toISOString().slice(0, 10);

  const issueDateStr = now.toISOString().slice(0, 10);
  const dueDateObj = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dueDateStr = dueDateObj.toISOString().slice(0, 10);

  try {
    // 1. Active billing schedules joined with their hosting package
    const activeSchedules = await db
      .select({
        scheduleId: billingSchedules.id,
        clientName: billingSchedules.clientName,
        clientEmail: billingSchedules.clientEmail,
        packageId: billingSchedules.packageId,
        packageName: hostingPackages.name,
        packagePriceRands: hostingPackages.priceRands,
      })
      .from(billingSchedules)
      .leftJoin(hostingPackages, eq(billingSchedules.packageId, hostingPackages.id))
      .where(eq(billingSchedules.isActive, true));

    if (activeSchedules.length === 0) {
      await db.insert(automationRuns).values({
        jobName: "recurring-billing",
        ranAt: now,
        triggeredBy,
        status: "success",
        resultSummary: "0 active billing schedules",
      });
      return { inserted: 0, skipped: 0 };
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const schedule of activeSchedules) {
      const priceRands = schedule.packagePriceRands ?? 0;
      const packageName = schedule.packageName ?? "Hosting Package";

      // Atomic invoice + line item write. onConflictDoNothing() enforces
      // idempotency; if it conflicts, invoice is undefined and we skip the
      // line item insert entirely (no orphaned line item on a skipped run).
      const insertedInvoiceId: number | null = await withTxDb((txDb) =>
        txDb.transaction(async (tx) => {
          const [invoice] = await tx
            .insert(invoices)
            .values({
              clientName: schedule.clientName,
              clientEmail: schedule.clientEmail ?? null,
              status: "draft",
              issueDate: issueDateStr,
              dueDate: dueDateStr,
              totalRands: priceRands,
              billingScheduleId: schedule.scheduleId,
              billingPeriodStart: billingPeriodStartStr,
            })
            .onConflictDoNothing()
            .returning({ id: invoices.id });

          if (!invoice) return null;

          await tx.insert(invoiceLineItems).values({
            invoiceId: invoice.id,
            description: `${packageName} – monthly hosting`,
            quantity: 1,
            unitPriceRands: priceRands,
            lineTotalRands: priceRands,
            sortOrder: 1,
          });

          return invoice.id;
        })
      );

      if (insertedInvoiceId === null) {
        skippedCount++;
        continue;
      }
      insertedCount++;
    }

    // 2. Audit trail
    await db.insert(automationRuns).values({
      jobName: "recurring-billing",
      ranAt: now,
      triggeredBy,
      status: "success",
      resultSummary: `Inserted ${insertedCount} invoice(s), skipped ${skippedCount} (already exists)`,
    });

    return { inserted: insertedCount, skipped: skippedCount };
  } catch (err) {
    await db.insert(automationRuns).values({
      jobName: "recurring-billing",
      ranAt: now,
      triggeredBy,
      status: "error",
      errorMessage: String(err),
    });
    throw err;
  }
}
