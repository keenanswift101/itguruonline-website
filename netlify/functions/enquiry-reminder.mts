import type { Config } from "@netlify/functions"
import { runEnquiryReminderJob } from "@/lib/automation/enquiry-reminder"

export default async (req: Request): Promise<void> => {
  const { next_run } = await req.json()
  console.log("[enquiry-reminder] Starting scheduled run")
  await runEnquiryReminderJob({ triggeredBy: "scheduled" })
  console.log("[enquiry-reminder] Completed. Next run at:", next_run)
}

export const config: Config = {
  schedule: "0 8 * * *",
}
