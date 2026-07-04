import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { automationRuns, billingSchedules, hostingPackages } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { RunNowButton } from "@/components/admin/RunNowButton";
import { AddScheduleForm } from "@/components/admin/AddScheduleForm";
import { DeactivateButton } from "@/components/admin/DeactivateButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Automations" };

// Human-readable labels for each job
const JOB_META = {
  "enquiry-reminder": {
    label: "Enquiry Reminder",
    schedule: "Daily at 08:00 UTC",
    description: "Sends a summary email when enquiries have had no status change.",
  },
  "invoice-reminder": {
    label: "Invoice Overdue Reminder",
    schedule: "Daily at 08:00 UTC",
    description: "Sends a reminder email for each overdue invoice.",
  },
  "recurring-billing": {
    label: "Recurring Billing",
    schedule: "1st of month at 07:00 UTC",
    description: "Creates Draft invoices for all active billing schedules.",
  },
} as const;

type JobName = keyof typeof JOB_META;

export default async function AutomationsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  // Fetch last run per job name (fetch recent rows and dedupe in JS — no
  // Postgres DISTINCT ON needed for a handful of job names)
  const allRuns = await db
    .select()
    .from(automationRuns)
    .orderBy(desc(automationRuns.ranAt))
    .limit(50);

  const lastRuns: Record<string, (typeof allRuns)[number] | undefined> = {};
  for (const run of allRuns) {
    if (!lastRuns[run.jobName]) {
      lastRuns[run.jobName] = run;
    }
  }

  // Fetch all billing schedules with package name
  const schedules = await db
    .select({
      id: billingSchedules.id,
      clientName: billingSchedules.clientName,
      clientEmail: billingSchedules.clientEmail,
      packageName: hostingPackages.name,
      packagePriceRands: hostingPackages.priceRands,
      billingStart: billingSchedules.billingStart,
      cycle: billingSchedules.cycle,
      isActive: billingSchedules.isActive,
    })
    .from(billingSchedules)
    .leftJoin(hostingPackages, eq(billingSchedules.packageId, hostingPackages.id))
    .orderBy(desc(billingSchedules.createdAt));

  // Package options for the Add Schedule form's dropdown
  const packages = await db
    .select({
      id: hostingPackages.id,
      name: hostingPackages.name,
      priceRands: hostingPackages.priceRands,
    })
    .from(hostingPackages)
    .orderBy(hostingPackages.sortOrder);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10" aria-label="Automations">
      <h1 className="text-2xl font-bold text-(--text-primary) mb-8">Automations</h1>

      {/* Job Cards */}
      <section aria-label="Scheduled Jobs" className="mb-12">
        <h2 className="text-lg font-semibold text-(--text-secondary) mb-4">Scheduled Jobs</h2>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          {(Object.keys(JOB_META) as JobName[]).map((jobName) => {
            const meta = JOB_META[jobName];
            const lastRun = lastRuns[jobName];
            return (
              <div
                key={jobName}
                className="rounded-xl border border-(--border-color) bg-(--bg-primary)/60 backdrop-blur-sm p-5"
              >
                <h3 className="font-semibold text-(--text-primary) mb-1">{meta.label}</h3>
                <p className="text-xs text-(--text-secondary) mb-3">{meta.schedule}</p>
                <p className="text-sm text-(--text-secondary) mb-4">{meta.description}</p>

                {lastRun ? (
                  <div className="mb-4 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          lastRun.status === "success"
                            ? "inline-block w-2 h-2 rounded-full bg-green-400"
                            : "inline-block w-2 h-2 rounded-full bg-red-400"
                        }
                      />
                      <span className="text-(--text-secondary) capitalize">{lastRun.status}</span>
                    </div>
                    <p className="text-(--text-secondary)">
                      Last run:{" "}
                      {new Date(lastRun.ranAt).toLocaleString("en-ZA", {
                        timeZone: "Africa/Johannesburg",
                      })}
                    </p>
                    {lastRun.resultSummary && (
                      <p className="text-(--text-secondary)">{lastRun.resultSummary}</p>
                    )}
                    {lastRun.errorMessage && (
                      <p className="text-red-400 truncate" title={lastRun.errorMessage}>
                        {lastRun.errorMessage}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mb-4 text-xs text-(--text-secondary)">Never run</p>
                )}

                <RunNowButton job={jobName} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Billing Schedules */}
      <section aria-label="Billing Schedules">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-(--text-secondary)">Billing Schedules</h2>
        </div>

        <AddScheduleForm packages={packages} />

        {schedules.length === 0 ? (
          <p className="text-sm text-(--text-secondary) mt-4">No billing schedules yet. Add one above.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm" aria-label="Billing schedules list">
              <thead>
                <tr className="border-b border-(--border-color) text-(--text-secondary) text-xs uppercase tracking-wider">
                  <th className="text-left pb-2 pr-4">Client</th>
                  <th className="text-left pb-2 pr-4">Package</th>
                  <th className="text-left pb-2 pr-4">Billing Start</th>
                  <th className="text-left pb-2 pr-4">Cycle</th>
                  <th className="text-left pb-2 pr-4">Status</th>
                  <th className="text-left pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b border-(--border-color) border-opacity-30">
                    <td className="py-3 pr-4 text-(--text-primary)">
                      <div>{s.clientName}</div>
                      {s.clientEmail && (
                        <div className="text-xs text-(--text-secondary)">{s.clientEmail}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-(--text-secondary)">
                      {s.packageName ?? "—"}
                      {s.packagePriceRands != null && (
                        <span className="ml-1 text-xs">R{s.packagePriceRands}/mo</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-(--text-secondary)">{String(s.billingStart)}</td>
                    <td className="py-3 pr-4 text-(--text-secondary) capitalize">{s.cycle}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          s.isActive
                            ? "inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-400"
                            : "inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-700/40 text-(--text-secondary)"
                        }
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">{s.isActive && <DeactivateButton scheduleId={s.id} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
