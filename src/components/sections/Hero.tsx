"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

const stats = [
  {
    value: 10,
    suffix: "+",
    label: "Years Active",
    statusDot: true,
    statusText: "Since 2014",
    statusColor: "#14b8a6",
    neon: "#2dd4bf",
    accent: "rgba(13,148,136,0.55)",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="10" cy="10" r="7.5" />
        <polyline points="10,5.5 10,10 13,12.5" />
      </svg>
    ),
  },
  {
    value: 20,
    suffix: "+",
    label: "Clients",
    statusDot: false,
    statusText: "Businesses Served",
    statusColor: "#64748b",
    neon: "#38bdf8",
    accent: null,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="7.5" cy="7" r="2.5" />
        <path d="M2.5 16c0-2.76 2.24-5 5-5h0c2.76 0 5 2.24 5 5" />
        <circle cx="14" cy="6.5" r="2" />
        <path d="M14 12.5h.5c2.07 0 3.5 1.57 3.5 3.5" />
      </svg>
    ),
  },
  {
    value: 99.9,
    suffix: "%",
    label: "Uptime",
    statusDot: true,
    statusText: "Guaranteed SLA",
    statusColor: "#22c55e",
    neon: "#4ade80",
    accent: "rgba(34,197,94,0.45)",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
        <path d="M10 2.5 L17 5.5 V10 C17 14 10 17.5 10 17.5 C10 17.5 3 14 3 10 V5.5 Z" />
        <polyline points="7,10 9.5,12.5 14,7.5" />
      </svg>
    ),
  },
  {
    value: 24,
    suffix: "/7",
    label: "Support",
    statusDot: true,
    statusText: "Always Available",
    statusColor: "#14b8a6",
    neon: "#a78bfa",
    accent: null,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
        <path d="M4 10a6 6 0 1 1 12 0" />
        <rect x="3" y="10" width="2.5" height="4" rx="1" />
        <rect x="14.5" y="10" width="2.5" height="4" rx="1" />
        <path d="M17 14.5 C17 16.5 15 17.5 10 17.5" />
      </svg>
    ),
  },
];

export function Hero() {

  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col" aria-label="Hero">

      {/* ── Content ── */}
      <div className="relative flex flex-col justify-center flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
          {/* ═══ Two-column layout ═══ */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">

            {/* Left: text */}
            <div className="animate-fade-in-up">
              <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl text-white">
                IT Solutions
                <span
                  className="block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #bfdbfe 0%, #60a5fa 30%, #2563eb 60%, #1d4ed8 80%, #1e3a8a 100%)",
                  }}
                >
                  Built to Last.
                </span>
              </h1>

              {/* Accent rule */}
              <div className="mt-6 h-1 w-20 rounded-full animation-delay-100" style={{ background: "linear-gradient(90deg, #2563eb, #60a5fa)" }} />

              <p className="mt-6 max-w-xl text-lg leading-relaxed animate-fade-in-up animation-delay-200 text-slate-300">
                Domains. Hosting. Networks. Support. — We handle the technology
                so you can focus on growing your business.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up animation-delay-400">
                <Link
                  href="/services"
                  className="btn-metallic inline-flex h-9 items-center justify-center px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  Explore Services
                </Link>
                <Link
                  href="/contact"
                  className="btn-glass inline-flex h-9 items-center justify-center px-5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  Get in Touch
                </Link>
              </div>
            </div>

            {/* Right: signage image card */}
            <div className="hidden lg:block animate-fade-in-up animation-delay-200">
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  background: "#07080d",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 25px 60px -10px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                <Image
                  src="/itgurusignage.png"
                  alt="IT-Guru Online neon signage"
                  width={2317}
                  height={1408}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Stats strip ── */}
        <div
          className="relative mt-auto backdrop-blur-sm animate-fade-in-up animation-delay-500"
        >
          <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-center sm:gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="relative flex flex-col justify-between p-3.5 sm:w-44 sm:p-4"
              >
                {/* Icon + label row */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="shrink-0 rounded-md p-1"
                    style={{ color: "rgba(45,212,191,0.90)", background: "rgba(13,148,136,0.15)" }}
                  >
                    {stat.icon}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-300">
                    {stat.label}
                  </span>
                </div>

                {/* Value */}
                <div className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>

                {/* Neon underline */}
                <div
                  className="mt-2 h-0.5 w-full rounded-full"
                  style={{
                    background: stat.neon,
                    boxShadow: `0 0 8px 3px ${stat.neon}80`,
                  }}
                />

                {/* Status row */}
                <div className="mt-2 flex items-center gap-1">
                  {stat.statusDot && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                  )}
                  <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-300">
                    {stat.statusText}
                  </span>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
