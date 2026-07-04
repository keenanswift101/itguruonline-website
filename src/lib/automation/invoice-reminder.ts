import { db } from "@/lib/db/index";
import { invoices, siteSettings, automationRuns } from "@/lib/db/schema";
import { eq, lt, or, isNull, and, inArray, sql } from "drizzle-orm";
import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";
import { formatInvoiceNumber } from "@/lib/invoices";

const ADMIN_REMINDER_EMAIL = "ambrose@it-guru.co.za";

export interface InvoiceReminderResult {
  sent: number;
  skipped: number;
}

/**
 * AUTOMATE-02 — overdue invoice reminder job.
 *
 * Sends ONE email PER overdue invoice (status "sent", past its due date by
 * `invoice_overdue_reminder_days`, default 1) to the admin reminder address.
 * Deduplicated per calendar day via `invoices.lastRemindedAt`.
 */
export async function runInvoiceReminderJob(
  opts?: { triggeredBy?: string; now?: Date }
): Promise<InvoiceReminderResult> {
  const now = opts?.now ?? new Date();
  const triggeredBy = opts?.triggeredBy ?? "scheduled";
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    // 1. Read invoice_overdue_reminder_days from site_settings (default 1)
    const [setting] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "invoice_overdue_reminder_days"));
    const reminderDays = parseInt(setting?.value ?? "1", 10);

    const cutoffDate = new Date(now.getTime() - reminderDays * 24 * 60 * 60 * 1000);
    const cutoffDateStr = cutoffDate.toISOString().slice(0, 10);

    // 2. Overdue invoices not yet reminded today
    const overdueInvoices = await db
      .select({
        id: invoices.id,
        clientName: invoices.clientName,
        clientEmail: invoices.clientEmail,
        dueDate: invoices.dueDate,
        totalRands: invoices.totalRands,
        fiscalYear: invoices.fiscalYear,
        sequenceNumber: invoices.sequenceNumber,
        lastRemindedAt: invoices.lastRemindedAt,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "sent"),
          lt(invoices.dueDate, cutoffDateStr),
          or(isNull(invoices.lastRemindedAt), lt(invoices.lastRemindedAt, sql`CURRENT_DATE`))
        )
      );

    // 3. Count already-reminded-today records (for the skipped count)
    const alreadyRemindedToday = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "sent"),
          lt(invoices.dueDate, cutoffDateStr),
          eq(invoices.lastRemindedAt, sql`CURRENT_DATE`)
        )
      );

    const skipped = alreadyRemindedToday.length;

    if (overdueInvoices.length === 0) {
      await db.insert(automationRuns).values({
        jobName: "invoice-reminder",
        ranAt: now,
        triggeredBy,
        status: "success",
        resultSummary: "0 overdue invoices",
      });
      return { sent: 0, skipped };
    }

    // 4. One email per overdue invoice
    let sentCount = 0;
    for (const invoice of overdueInvoices) {
      const invNumber = formatInvoiceNumber(invoice.fiscalYear, invoice.sequenceNumber);
      const subject = `Overdue Invoice Reminder — ${invNumber} is overdue`;
      const bodyHtml = `
        <p style="margin:0 0 16px 0;">The following invoice is overdue and awaiting payment:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:8px 12px; background:#f8fafc; font-weight:600; width:40%;">Invoice</td>
            <td style="padding:8px 12px;">${escapeHtml(invNumber)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f8fafc; font-weight:600;">Client</td>
            <td style="padding:8px 12px;">${escapeHtml(invoice.clientName)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f8fafc; font-weight:600;">Due Date</td>
            <td style="padding:8px 12px; color:#ef4444;">${String(invoice.dueDate)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f8fafc; font-weight:600;">Amount</td>
            <td style="padding:8px 12px;">R${invoice.totalRands}</td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;">Please follow up with the client or mark the invoice as paid in the admin panel.</p>
      `;
      await sendEmail({
        to: ADMIN_REMINDER_EMAIL,
        subject,
        html: emailLayout(subject, bodyHtml),
      });
      sentCount++;
    }

    // 5. Mark all reminded invoices with today's date (dedup for future runs)
    const remindedIds = overdueInvoices.map((i) => i.id);
    await db
      .update(invoices)
      .set({ lastRemindedAt: today })
      .where(inArray(invoices.id, remindedIds));

    // 6. Audit trail
    await db.insert(automationRuns).values({
      jobName: "invoice-reminder",
      ranAt: now,
      triggeredBy,
      status: "success",
      resultSummary: `Sent ${sentCount} overdue invoice reminder(s)`,
    });

    return { sent: sentCount, skipped };
  } catch (err) {
    await db.insert(automationRuns).values({
      jobName: "invoice-reminder",
      ranAt: now,
      triggeredBy,
      status: "error",
      errorMessage: String(err),
    });
    throw err;
  }
}
