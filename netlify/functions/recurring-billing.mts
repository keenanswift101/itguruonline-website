import type { Config } from "@netlify/functions"
import { runRecurringBillingJob } from "@/lib/automation/recurring-billing"

export default async (req: Request): Promise<void> => {
  const { next_run } = await req.json()
  console.log("[recurring-billing] Starting scheduled run")
  await runRecurringBillingJob({ triggeredBy: "scheduled" })
  console.log("[recurring-billing] Completed. Next run at:", next_run)
}

export const config: Config = {
  schedule: "0 7 1 * *",
}
