"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { DomainChecker } from "@/components/forms/DomainChecker";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ProcessCarousel } from "@/components/ui/ProcessCards";

const stats = [
  {
    value: 10,
    suffix: "+",
    label: "Years Active",
    statusDot: true,
    statusText: "Since 2014",
    statusColor: "#14b8a6",
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

const taglines = [
  "That Simply Work.",
  "You Can Trust.",
  "Built to Last.",
  "Around the Clock.",
  "Designed to Scale.",
];

function RotatingTagline() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      // Fade out, swap text, fade in — no DOM node destruction
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % taglines.length);
        setVisible(true);
      }, 280);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="block min-h-[2.16em] lg:min-h-[1.12em] overflow-hidden">
      <span
        className="block bg-linear-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}
      >
        {taglines[index]}
      </span>
    </span>
  );
}

export function Hero() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className="relative overflow-hidden">
      {/* ── Full-bleed background image ── */}
      <Image
        src="/itguru-img4.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
        aria-hidden="true"
      />

      {/* ── Overlays — dark: dramatic dark wash / light: bright airy wash ── */}
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-linear-to-b from-gray-950/82 via-gray-950/75 to-gray-950/88" aria-hidden="true" />
          <div className="absolute inset-0 bg-linear-to-r from-gray-950/65 via-gray-950/30 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-primary-900/20 to-transparent" aria-hidden="true" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-linear-to-b from-white/70 via-slate-50/55 to-white/65" aria-hidden="true" />
          <div className="absolute inset-0 bg-linear-to-r from-white/60 via-white/25 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-primary-100/40 to-transparent" aria-hidden="true" />
        </>
      )}

      {/* ── Content ── */}
      <div className="relative flex flex-col justify-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
          {/* ═══ Two-column split ═══ */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* ── Left: Content ── */}
            <div className="animate-fade-in-up">
              <h1 className={`text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                IT Solutions
                <RotatingTagline />
              </h1>

              {/* Accent rule */}
              <div className="mt-6 h-1 w-20 rounded-full bg-primary-500 animation-delay-100" />

              <p className={`mt-6 max-w-xl text-lg leading-relaxed animate-fade-in-up animation-delay-200 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                Domains. Hosting. Networks. Support. — We handle the technology
                so you can focus on growing your business.
              </p>

              {/* Domain Checker */}
              <div className="mt-8 max-w-lg animate-fade-in-up animation-delay-300">
                <p className={`mb-3 text-sm font-semibold uppercase tracking-widest ${isDark ? "text-primary-400/70" : "text-primary-700"}`}>
                  Find your perfect domain
                </p>
                <DomainChecker />
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up animation-delay-400">
                <Link
                  href="/services"
                  className={`btn-metallic inline-flex h-12 items-center justify-center px-7 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${isDark ? "text-slate-900 focus:ring-offset-gray-900" : "text-white focus:ring-offset-white"}`}
                >
                  Explore Services
                </Link>
                <Link
                  href="/contact"
                  className={`btn-glass inline-flex h-12 items-center justify-center px-7 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 ${isDark ? "text-teal-300 focus:ring-offset-gray-900" : "text-primary-700 focus:ring-offset-white"}`}
                >
                  Get in Touch
                </Link>
              </div>
            </div>

            {/* ── Right: Process carousel ── */}
            <div className="flex justify-center lg:justify-end animate-fade-in-right animation-delay-200">
              <div className="w-full max-w-sm sm:max-w-md lg:max-w-none">
                <ProcessCarousel />
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div
          className={`relative mt-auto backdrop-blur-sm animate-fade-in-up animation-delay-500 ${isDark ? "border-t border-white/8" : "border-t border-black/8"}`}
          style={isDark ? {
            backgroundColor: "rgba(8,15,26,0.75)",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          } : {
            backgroundColor: "rgba(248,250,252,0.88)",
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          <div className="mx-auto flex max-w-7xl justify-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 lg:px-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="relative flex w-36 flex-col justify-between rounded-xl p-3.5 sm:w-44 sm:p-4"
                style={isDark ? {
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  ...(stat.accent ? { borderLeft: `2px solid ${stat.accent}` } : {}),
                } : {
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)",
                  ...(stat.accent ? { borderLeft: `2px solid ${stat.accent}` } : {}),
                }}
              >
                {/* Icon + label row */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="shrink-0 rounded-md p-1"
                    style={isDark ? {
                      color: stat.accent ? stat.accent : "rgba(148,163,184,0.7)",
                      background: stat.accent
                        ? `${stat.accent.replace("0.55", "0.10").replace("0.45", "0.10")}`
                        : "rgba(255,255,255,0.05)",
                    } : {
                      color: stat.accent ? stat.accent.replace("0.55", "0.85").replace("0.45", "0.85") : "rgba(100,116,139,0.8)",
                      background: stat.accent
                        ? `${stat.accent.replace("0.55", "0.08").replace("0.45", "0.08")}`
                        : "rgba(0,0,0,0.04)",
                    }}
                  >
                    {stat.icon}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {stat.label}
                  </span>
                </div>

                {/* Value */}
                <div className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>

                {/* Status row */}
                <div className="mt-2 flex items-center gap-1">
                  {stat.statusDot && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: stat.statusColor }}
                    />
                  )}
                  <span
                    className="text-[9px] font-medium uppercase tracking-[0.12em]"
                    style={{ color: stat.statusColor }}
                  >
                    {stat.statusText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
