"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 60_000;

interface NewCounts {
  registrations: number;
  enquiries: number;
  total: number;
}

export function NotificationBell() {
  const [counts, setCounts] = useState<NewCounts | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/crm/new-count");
        if (!res.ok) return;
        const data = (await res.json()) as NewCounts;
        if (!cancelled) setCounts(data);
      } catch {
        // transient network error — keep last known counts
      }
    }

    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const total = counts?.total ?? 0;
  const label =
    total === 0
      ? "No new CRM records"
      : `${total} new CRM record${total === 1 ? "" : "s"} — ${counts?.registrations ?? 0} registration(s), ${counts?.enquiries ?? 0} enquiry(ies)`;

  return (
    <Link
      href="/admin/crm"
      aria-label={label}
      title={label}
      className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {total > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#00aaff] text-[10px] font-bold leading-4 text-center text-white"
          style={{ boxShadow: "0 0 8px rgba(0, 170, 255, 0.8)" }}
        >
          {total > 99 ? "99+" : total}
        </span>
      )}
    </Link>
  );
}
