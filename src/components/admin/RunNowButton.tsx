"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type JobName = "enquiry-reminder" | "invoice-reminder" | "recurring-billing";

interface RunNowButtonProps {
  job: JobName;
}

interface JobResult {
  ok: boolean;
  summary?: { sent?: number; skipped?: number; inserted?: number };
  error?: string;
}

export function RunNowButton({ job }: RunNowButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobResult | null>(null);

  async function handleRun() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/automations/${job}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as JobResult;
      setResult(data);
      if (data.ok) {
        router.refresh();
      }
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  function formatSummary(summary: JobResult["summary"]): string {
    if (!summary) return "";
    if ("inserted" in summary) {
      return `Created ${summary.inserted ?? 0} invoice(s), skipped ${summary.skipped ?? 0}`;
    }
    return `Sent ${summary.sent ?? 0} reminder(s), skipped ${summary.skipped ?? 0}`;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="btn-glass text-sm px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Running…" : "Run Now"}
      </button>
      {result && (
        <p
          className={
            result.ok
              ? "mt-2 text-sm text-(--text-secondary)"
              : "mt-2 text-sm text-red-400"
          }
        >
          {result.ok ? formatSummary(result.summary) : result.error}
        </p>
      )}
    </div>
  );
}
