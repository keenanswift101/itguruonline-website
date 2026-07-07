"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

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
  const toast = useToast();
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
        toast.success(`Job finished — ${formatSummary(data.summary)}.`);
        router.refresh();
      } else {
        toast.error(data.error ?? "The job failed. Check the function logs.");
      }
    } catch {
      const msg = "Couldn't reach the server. Check your connection and try again.";
      setResult({ ok: false, error: msg });
      toast.error(msg);
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
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Running…
          </span>
        ) : (
          "Run Now"
        )}
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
