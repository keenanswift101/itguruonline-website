import { vi, describe, it } from "vitest"

vi.mock("@/lib/db/index")
vi.mock("resend")
vi.mock("@/lib/email")

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip

describe("runEnquiryReminderJob", () => {
  it.todo("sends reminder email for each stale enquiry")
  it.todo("skips enquiries already reminded today (last_reminded_at = today)")
  it.todo("sends to ambrose@it-guru.co.za not enquiry submitter email")
  it.todo("updates last_reminded_at after sending")
  it.todo("writes automation_runs row with status success")
  it.todo("returns correct sent and skipped counts")
})

describeIfDb("runEnquiryReminderJob (integration)", () => {
  it.todo("end-to-end: selects stale records and marks them reminded")
})
