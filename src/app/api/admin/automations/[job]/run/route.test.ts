import { vi, describe, it } from "vitest"

vi.mock("@/lib/auth")
vi.mock("@/lib/automation/enquiry-reminder")
vi.mock("@/lib/automation/invoice-reminder")
vi.mock("@/lib/automation/recurring-billing")

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip

describe("POST /api/admin/automations/[job]/run", () => {
  it.todo("returns 401 when session is missing (no admin cookie)")
  it.todo("returns 404 for unknown job name bad-job")
  it.todo("returns 200 with summary for enquiry-reminder")
  it.todo("returns 200 with summary for invoice-reminder")
  it.todo("returns 200 with summary for recurring-billing")
})
