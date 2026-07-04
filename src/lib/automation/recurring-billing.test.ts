import { vi, describe, it } from "vitest"

vi.mock("@/lib/db/index")

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip

describe("runRecurringBillingJob", () => {
  it.todo("inserts draft invoice with billing_period_start = 1st of current month")
  it.todo("inserts invoice line item with package description and price")
  it.todo("second call returns inserted=0 skipped=N (ON CONFLICT DO NOTHING)")
  it.todo("writes automation_runs row with correct summary")
  it.todo("returns correct inserted and skipped counts")
})

describeIfDb("runRecurringBillingJob (integration)", () => {
  it.todo("end-to-end: idempotency confirmed against real DB unique constraint")
})
