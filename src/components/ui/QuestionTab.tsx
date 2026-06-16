"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function QuestionTab() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pathname !== "/") { setShow(false); return; }
    const t = setTimeout(() => setShow(true), 1800);
    return () => clearTimeout(t);
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <div
      className="fixed right-0 z-50 transition-transform duration-700 ease-out"
      style={{ top: "88px", transform: show ? "translateX(0)" : "translateX(100%)" }}
    >
      <Link
        href="/contact"
        className="btn-metallic group flex items-center gap-0 rounded-l-xl rounded-r-none py-2 pl-2 pr-2 transition-[padding,gap] duration-300 hover:gap-1.5 hover:pl-3 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label="Questions? Go to the contact page"
      >
        <svg
          className="h-3.5 w-3.5 shrink-0 group-hover:-translate-x-0.5 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold tracking-wide select-none transition-all duration-300 group-hover:max-w-22.5">
          Questions?
        </span>
      </Link>
    </div>
  );
}
