"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("cookie-consent")) return;
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  }

  return (
    <div
      className="fixed z-[60] w-[min(92vw,460px)] transition-all duration-500 ease-out"
      style={{
        bottom: show ? "1rem" : "-100%",
        left: "50%",
        transform: "translateX(-50%)",
      }}
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-(--border-color) bg-(--bg-primary) px-5 py-4 shadow-2xl">
        <div className="flex items-start gap-3">
          {/* Cookie icon */}
          <span className="mt-0.5 shrink-0 text-primary-600 dark:text-primary-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </span>
          <p className="text-sm leading-relaxed text-(--text-secondary)">
            We use cookies to improve your experience. By continuing you agree to our{" "}
            <Link href="/privacy" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={decline}
            className="rounded-lg border border-(--border-color) px-4 py-1.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-surface) focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-primary-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
