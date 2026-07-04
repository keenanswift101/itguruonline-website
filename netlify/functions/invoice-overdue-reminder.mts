import type { Config } from "@netlify/functions"
import { runInvoiceReminderJob } from "@/lib/automation/invoice-reminder"

export default async (req: Request): Promise<void> => {
  const { next_run } = await req.json()
  console.log("[invoice-overdue-reminder] Starting scheduled run")
  await runInvoiceReminderJob({ triggeredBy: "scheduled" })
  console.log("[invoice-overdue-reminder] Completed. Next run at:", next_run)
}

export const config: Config = {
  schedule: "0 8 * * *",
}
