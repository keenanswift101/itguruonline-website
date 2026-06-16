"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PRIMARY_TLD } from "@/lib/domain-validator";
import type { DomainCheckResponse, TldResult } from "@/app/api/domain/check/route";

type CheckState = "idle" | "loading" | "done" | "error";

function AvailabilityBadge({ available, error }: { available: boolean; error?: string }) {
  if (error) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300">
        <span>?</span> Unknown
      </span>
    );
  }
  if (available) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Taken
    </span>
  );
}

function DomainRow({
  result,
  onSelect,
  isPrimary = false,
}: {
  result: TldResult;
  onSelect: (domain: string) => void;
  isPrimary?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 backdrop-blur-xl transition-colors ${
        isPrimary
          ? "border-[#00aaff]/50 bg-[#00aaff]/8 shadow-[0_0_16px_-4px_rgba(0,170,255,0.45)]"
          : "border-white/15 bg-white/8"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isPrimary && (
          <span className="hidden sm:inline-flex shrink-0 rounded-full bg-[#00aaff]/20 px-2 py-0.5 text-xs font-semibold text-primary-300">
            Recommended
          </span>
        )}
        <span className="font-medium truncate text-white">{result.domain}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <AvailabilityBadge available={result.available} error={result.error} />
        {result.available && !result.error && (
          <Button size="sm" onClick={() => onSelect(result.domain)}>
            Register
          </Button>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-color)] px-4 py-3 animate-pulse">
      <div className="h-5 w-48 rounded bg-[var(--bg-surface)]" />
      <div className="h-6 w-20 rounded-full bg-[var(--bg-surface)]" />
    </div>
  );
}

export function DomainChecker({
  initialDomain = "",
  primaryTld = PRIMARY_TLD,
}: {
  initialDomain?: string;
  /** Override the TLD shown in the input suffix and marked as "Recommended". Defaults to PRIMARY_TLD from domain-validator. */
  primaryTld?: string;
}) {
  const [input, setInput] = useState(initialDomain);
  const [state, setState] = useState<CheckState>("idle");
  const [result, setResult] = useState<DomainCheckResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState("loading");
    setResult(null);
    setApiError(null);

    try {
      const res = await fetch("/api/domain/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: input.trim() }),
        signal: abortRef.current.signal,
      });

      const data: DomainCheckResponse & { error?: string } = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setResult(data);
      setState("done");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setApiError("Network error. Please check your connection and try again.");
      setState("error");
    }
  }

  function handleSelect(domain: string) {
    router.push(`/register?domain=${encodeURIComponent(domain)}`);
  }

  return (
    <div className="w-full">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your preferred domain name here..."
            aria-label="Domain name to check"
            className="h-12 w-full rounded-xl border border-(--border-color) bg-(--bg-primary) px-4 text-base text-(--text-primary) placeholder:text-(--text-secondary)/60 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            maxLength={63}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={state === "loading" || !input.trim()}
          className="shrink-0 rounded-xl"
        >
          {state === "loading" ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Checking…
            </span>
          ) : (
            "Check"
          )}
        </Button>
      </form>

      {/* Loading skeletons */}
      {state === "loading" && (
        <div className="mt-6 flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {state === "error" && apiError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400"
        >
          {apiError}
        </div>
      )}

      {/* Results — politely announced to screen readers when populated */}
      {state === "done" && result && (
        <div className="mt-6 flex flex-col gap-2" role="status" aria-live="polite" aria-label="Domain availability results">
      {/* Primary result (the configured primaryTld) */}
          <DomainRow result={result.primary} onSelect={handleSelect} isPrimary />

          {/* Divider */}
          {result.alternatives.length > 0 && (
            <p className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Also available as
            </p>
          )}

          {/* Alternative TLDs */}
          {result.alternatives.map((alt) => (
            <DomainRow key={alt.tld} result={alt} onSelect={handleSelect} />
          ))}

          {/* All taken nudge */}
          {!result.primary.available &&
            result.alternatives.every((a) => !a.available) && (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                All checked TLDs are taken. Try a variation of your name — add words
                like your city, industry, or a keyword.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
