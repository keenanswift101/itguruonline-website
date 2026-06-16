"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function DomainPromo() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pathname !== "/") { setShow(false); return; }
    if (sessionStorage.getItem("domain-promo-dismissed")) return;
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, [pathname]);

  function dismiss() {
    sessionStorage.setItem("domain-promo-dismissed", "1");
    setShow(false);
  }

  if (pathname !== "/") return null;

  return (
    <div
      className="fixed right-4 z-55 w-60 transition-all duration-500 ease-out"
      style={{ bottom: show ? "5.5rem" : "-100%" }}
      role="dialog"
      aria-label="Domain registration promo"
    >
      <div className="relative rounded-2xl border border-[#00aaff]/40 bg-white/8 backdrop-blur-xl p-5 shadow-[0_0_24px_-6px_rgba(0,170,255,0.45)]">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Dismiss"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Globe icon */}
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400/10 text-primary-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>

        <h3 className="text-sm font-bold text-white">Own Your Domain</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          Register your .co.za or international domain — fast, affordable, fully managed.
        </p>

        <Link
          href="/register"
          onClick={dismiss}
          className="btn-metallic mt-4 inline-flex w-full items-center justify-center gap-1.5 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Register Now
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
