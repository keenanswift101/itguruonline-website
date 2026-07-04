import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { runEnquiryReminderJob } from "@/lib/automation/enquiry-reminder";
import { runInvoiceReminderJob } from "@/lib/automation/invoice-reminder";
import { runRecurringBillingJob } from "@/lib/automation/recurring-billing";

const VALID_JOBS = ["enquiry-reminder", "invoice-reminder", "recurring-billing"] as const;
type JobName = typeof VALID_JOBS[number];
type Params = { params: Promise<{ job: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { job } = await params;
  if (!VALID_JOBS.includes(job as JobName)) {
    return NextResponse.json({ error: "Unknown job" }, { status: 404 });
  }

  try {
    let result;
    if (job === "enquiry-reminder") {
      result = await runEnquiryReminderJob({ triggeredBy: "manual" });
    } else if (job === "invoice-reminder") {
      result = await runInvoiceReminderJob({ triggeredBy: "manual" });
    } else {
      result = await runRecurringBillingJob({ triggeredBy: "manual" });
    }
    return NextResponse.json({ ok: true, summary: result });
  } catch (err) {
    // Log details server-side only — raw driver/DB errors can leak
    // internals (hosts, SQL) even to an authenticated admin's browser.
    console.error(`[automations] ${job} manual run failed:`, err);
    return NextResponse.json({ ok: false, error: "Job failed — check function logs." }, { status: 500 });
  }
}
