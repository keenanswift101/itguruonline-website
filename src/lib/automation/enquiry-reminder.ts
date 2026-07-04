import { db } from "@/lib/db/index";
import { contactEnquiries, siteSettings, automationRuns } from "@/lib/db/schema";
import { eq, ne, lt, or, isNull, and, inArray, sql } from "drizzle-orm";
import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";

const ADMIN_REMINDER_EMAIL = "ambrose@it-guru.co.za";

export interface EnquiryReminderResult {
  sent: number;
  skipped: number;
}

/**
 * AUTOMATE-01 — stale enquiry reminder job.
 *
 * Sends ONE summary email (not one per enquiry) listing every contact
 * enquiry that hasn't had a status change in `enquiry_stale_days` (site
 * setting, default 7). Deduplicated per calendar day via
 * `contactEnquiries.lastRemindedAt` — records already reminded today are
 * skipped and excluded from the email.
 */
export async function runEnquiryReminderJob(
  opts?: { triggeredBy?: string; now?: Date }
): Promise<EnquiryReminderResult> {
  const now = opts?.now ?? new Date();
  const triggeredBy = opts?.triggeredBy ?? "scheduled";
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    // 1. Read enquiry_stale_days from site_settings (default 7 if unset)
    const [setting] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "enquiry_stale_days"));
    const staleDays = parseInt(setting?.value ?? "7", 10);

    const cutoffDate = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);

    // 2. Stale enquiries not yet reminded today
    const staleEnquiries = await db
      .select({
        id: contactEnquiries.id,
        name: contactEnquiries.name,
        updatedAt: contactEnquiries.createdAt,
        lastRemindedAt: contactEnquiries.lastRemindedAt,
      })
      .from(contactEnquiries)
      .where(
        and(
          ne(contactEnquiries.status, "completed"),
          lt(contactEnquiries.createdAt, cutoffDate),
          or(isNull(contactEnquiries.lastRemindedAt), lt(contactEnquiries.lastRemindedAt, sql`CURRENT_DATE`))
        )
      );

    // 3. Count already-reminded-today records (for the skipped count)
    const alreadyRemindedToday = await db
      .select({ id: contactEnquiries.id })
      .from(contactEnquiries)
      .where(
        and(
          ne(contactEnquiries.status, "completed"),
          lt(contactEnquiries.createdAt, cutoffDate),
          eq(contactEnquiries.lastRemindedAt, sql`CURRENT_DATE`)
        )
      );

    const skipped = alreadyRemindedToday.length;

    if (staleEnquiries.length === 0) {
      await db.insert(automationRuns).values({
        jobName: "enquiry-reminder",
        ranAt: now,
        triggeredBy,
        status: "success",
        resultSummary: "0 stale enquiries",
      });
      return { sent: 0, skipped };
    }

    // 4. Build the summary email — table-based, inline styles (no
    // flexbox/grid; webmail clients strip <style> blocks, per CLAUDE.md).
    const rows = staleEnquiries
      .map((e) => {
        const daysSince = Math.floor(
          (now.getTime() - new Date(e.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return `<tr>
          <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0;">${escapeHtml(e.name)}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; color:#ef4444;">${daysSince} days</td>
        </tr>`;
      })
      .join("");

    const bodyHtml = `
      <p style="margin:0 0 16px 0;">The following ${staleEnquiries.length} enquiry(ies) have had no status change in over ${staleDays} days:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; border:1px solid #e2e8f0;">
        <tr>
          <th style="padding:8px 12px; background:#f8fafc; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.05em;">Name</th>
          <th style="padding:8px 12px; background:#f8fafc; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.05em;">Stale For</th>
        </tr>
        ${rows}
      </table>
      <p style="margin:16px 0 0 0;">Please follow up or update their status in the admin panel.</p>
    `;

    const subject = `Stale Enquiry Reminder — ${staleEnquiries.length} enquiry(ies) need attention`;
    await sendEmail({
      to: ADMIN_REMINDER_EMAIL,
      subject,
      html: emailLayout(subject, bodyHtml),
    });

    // 5. Mark all reminded records with today's date (dedup for future runs)
    const remindedIds = staleEnquiries.map((e) => e.id);
    await db
      .update(contactEnquiries)
      .set({ lastRemindedAt: today })
      .where(inArray(contactEnquiries.id, remindedIds));

    // 6. Audit trail
    await db.insert(automationRuns).values({
      jobName: "enquiry-reminder",
      ranAt: now,
      triggeredBy,
      status: "success",
      resultSummary: `Sent reminder for ${staleEnquiries.length} stale enquiry(ies)`,
    });

    return { sent: 1, skipped };
  } catch (err) {
    await db.insert(automationRuns).values({
      jobName: "enquiry-reminder",
      ranAt: now,
      triggeredBy,
      status: "error",
      errorMessage: String(err),
    });
    throw err;
  }
}
