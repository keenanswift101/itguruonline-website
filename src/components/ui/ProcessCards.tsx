"use client";

import { useState, useEffect, useCallback } from "react";

/* ────────────────────────────────────────────────────────────
   ProcessCarousel — 6 polished animated cards for the hero
   Each card has a mock UI with animated cursor interaction
   ──────────────────────────────────────────────────────────── */

/* ── Reusable animated cursor pointer ── */
function AnimatedCursor({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute h-5 w-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   Card 1 — Rapid Diagnostics (Process Flow)
   ══════════════════════════════════════════════ */
function DiagnosticsCard() {
  const steps = [
    { label: "SCAN", icon: "S" },
    { label: "DETECT", icon: "D" },
    { label: "RESOLVE", icon: "R" },
    { label: "VERIFY", icon: "V" },
  ];

  return (
    <CardShell
      stat="< 4h"
      statLabel="Avg Resolution"
      title="Rapid Diagnostics"
      desc="Systematic 4-step approach — from detection to verified resolution."
    >
      <div className="relative">
        <div className="flex items-center justify-between w-full">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg border dark:border-white/10 border-(--border-color) dark:bg-gray-950/60 bg-(--bg-surface) text-xs font-bold dark:text-primary-400 text-primary-600 animate-[node-glow_5s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 1.2}s` }}
                >
                  {step.icon}
                </div>
                <span className="text-[8px] font-bold tracking-widest dark:text-gray-500 text-(--text-secondary)">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-1.5 h-px w-5 overflow-hidden bg-gray-700/50 mb-4">
                  <div
                    className="h-full bg-primary-500 animate-[line-fill_5s_ease-in-out_infinite] origin-left"
                    style={{ animationDelay: `${i * 1.2 + 0.6}s` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <AnimatedCursor className="bottom-0 right-6 animate-[cursor-click_5s_ease-in-out_infinite]" />
      </div>
    </CardShell>
  );
}

/* ══════════════════════════════════════════════
   Card 2 — Server Rack (Live Servers)
   ══════════════════════════════════════════════ */
function ServerRackCard() {
  const servers = [
    { name: "PRD-WEB-01", cpu: 34, ram: 62, status: "running" },
    { name: "PRD-DB-01", cpu: 58, ram: 71, status: "running" },
    { name: "PRD-MAIL-01", cpu: 12, ram: 45, status: "running" },
    { name: "PRD-BKUP-01", cpu: 89, ram: 83, status: "running" },
  ];

  return (
    <CardShell
      stat="4"
      statLabel="Servers Managed"
      title="Server Infrastructure"
      desc="Real-time health monitoring across your entire server fleet."
    >
      <div className="relative space-y-1.5 font-mono text-[9px]">
        <div className="grid grid-cols-[1fr_50px_50px_52px] gap-1 dark:text-gray-600 text-(--text-secondary) font-semibold border-b dark:border-white/5 border-(--border-color) pb-1">
          <span>HOST</span><span>CPU</span><span>RAM</span><span>STATUS</span>
        </div>
        {servers.map((srv, i) => (
          <div
            key={srv.name}
            className="grid grid-cols-[1fr_50px_50px_52px] gap-1 items-center animate-[row-fade_0.4s_ease-out_both]"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <span className="dark:text-gray-300 text-(--text-primary) truncate">{srv.name}</span>
            <div className="flex items-center gap-1">
              <div className="h-1 w-7 rounded-full dark:bg-gray-800 bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full animate-[metric-bar_3s_ease-in-out_infinite]"
                  style={{
                    width: `${srv.cpu}%`,
                    backgroundColor: srv.cpu > 80 ? "#f59e0b" : "#14b8a6",
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              </div>
              <span className="text-gray-500">{srv.cpu}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1 w-7 rounded-full dark:bg-gray-800 bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 animate-[metric-bar_3s_ease-in-out_infinite]"
                  style={{ width: `${srv.ram}%`, animationDelay: `${i * 0.5 + 0.2}s` }}
                />
              </div>
              <span className="text-gray-500">{srv.ram}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full bg-green-400 animate-[blink_2.5s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              <span className="dark:text-green-400 text-green-600">{srv.status}</span>
            </div>
          </div>
        ))}
        <AnimatedCursor className="-bottom-1 right-2 animate-[cursor-hover_3s_ease-in-out_infinite]" />
      </div>
    </CardShell>
  );
}

/* ══════════════════════════════════════════════
   Card 3 — Uptime Monitor Dashboard
   ══════════════════════════════════════════════ */
function UptimeCard() {
  const services = [
    { name: "Website", uptime: 99.99, bars: [1,1,1,1,1,1,1,1,1,1,1,1,0.5,1,1,1,1,1,1,1] },
    { name: "Email", uptime: 99.95, bars: [1,1,1,0.5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { name: "DNS", uptime: 100.0, bars: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
  ];

  return (
    <CardShell
      stat="99.9%"
      statLabel="Guaranteed"
      title="Uptime Monitoring"
      desc="Continuous infrastructure monitoring across every critical service."
    >
      <div className="relative space-y-3">
        {services.map((svc, si) => (
          <div key={svc.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium dark:text-gray-300 text-(--text-primary)">{svc.name}</span>
              <span className="text-[9px] font-bold dark:text-primary-400 text-primary-600">{svc.uptime}%</span>
            </div>
            <div className="flex gap-0.5">
              {svc.bars.map((v, i) => (
                <div
                  key={i}
                  className="h-3 flex-1 rounded-[2px] animate-[bar-pop_0.3s_ease-out_both]"
                  style={{
                    backgroundColor: v === 1 ? "#14b8a6" : "#f59e0b",
                    opacity: v === 1 ? 0.7 : 0.9,
                    animationDelay: `${si * 0.15 + i * 0.03}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        <AnimatedCursor className="-bottom-1 left-1/2 animate-[cursor-scan_4s_ease-in-out_infinite]" />
      </div>
    </CardShell>
  );
}

/* ══════════════════════════════════════════════
   Card 4 — Live Support Chat
   ══════════════════════════════════════════════ */
function SupportChatCard() {
  const msgs = [
    { from: "client", text: "Network is dropping connections", delay: 0 },
    { from: "agent", text: "Checking your switch config now...", delay: 1.2 },
    { from: "client", text: "Affecting 12 workstations", delay: 2.4 },
    { from: "agent", text: "Found it - VLAN mismatch. Fixing now", delay: 3.6 },
  ];

  return (
    <CardShell
      stat="24/7"
      statLabel="Always On"
      title="Dedicated Support"
      desc="Real-time expert support with fast, verified resolutions."
    >
      <div className="relative rounded-lg border dark:border-white/10 border-(--border-color) dark:bg-gray-950/60 bg-(--bg-surface) overflow-hidden">
        <div className="flex items-center gap-2 border-b dark:border-white/5 border-(--border-color) px-3 py-1.5">
          <div className="h-4 w-4 rounded bg-primary-600 flex items-center justify-center text-[6px] font-bold text-white">IG</div>
          <span className="text-[9px] font-semibold dark:text-gray-400 text-(--text-secondary)">Live Support</span>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
        <div className="p-2.5 space-y-1.5 min-h-[90px]">
          {msgs.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "agent" ? "justify-end" : ""} animate-[chat-in_0.35s_ease-out_both]`}
              style={{ animationDelay: `${msg.delay}s` }}
            >
              <div className={`max-w-[82%] rounded-md px-2.5 py-1 text-[9px] leading-relaxed ${
                msg.from === "agent"
                  ? "dark:bg-primary-600/15 dark:border-primary-500/20 dark:text-primary-200 bg-primary-50 border border-primary-200 text-primary-700"
                  : "dark:bg-white/5 dark:border-white/8 dark:text-gray-300 bg-(--bg-primary) border border-(--border-color) text-(--text-primary)"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <AnimatedCursor className="bottom-2 right-8 animate-[cursor-type_2s_steps(4,end)_infinite]" />
      </div>
    </CardShell>
  );
}

/* ══════════════════════════════════════════════
   Card 5 — Network Topology
   ══════════════════════════════════════════════ */
function NetworkCard() {
  const nodes = [
    { label: "Firewall", x: "50%", y: "8%" },
    { label: "Switch", x: "20%", y: "45%" },
    { label: "Router", x: "80%", y: "45%" },
    { label: "AP", x: "50%", y: "82%" },
  ];

  return (
    <CardShell
      stat="100+"
      statLabel="Devices Managed"
      title="Network Infrastructure"
      desc="Full network design, deployment, and ongoing management."
    >
      <div className="relative h-[130px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 130" fill="none">
          <line x1="100" y1="22" x2="40" y2="60" stroke="rgb(20 184 166 / 0.3)" strokeWidth="1" className="animate-[line-draw_3s_ease-in-out_infinite]" />
          <line x1="100" y1="22" x2="160" y2="60" stroke="rgb(20 184 166 / 0.3)" strokeWidth="1" className="animate-[line-draw_3s_ease-in-out_infinite]" style={{ animationDelay: "0.3s" }} />
          <line x1="40" y1="60" x2="100" y2="108" stroke="rgb(20 184 166 / 0.3)" strokeWidth="1" className="animate-[line-draw_3s_ease-in-out_infinite]" style={{ animationDelay: "0.6s" }} />
          <line x1="160" y1="60" x2="100" y2="108" stroke="rgb(20 184 166 / 0.3)" strokeWidth="1" className="animate-[line-draw_3s_ease-in-out_infinite]" style={{ animationDelay: "0.9s" }} />
          <circle r="2" fill="#14b8a6">
            <animateMotion dur="2s" repeatCount="indefinite" path="M100,22 L40,60" />
          </circle>
          <circle r="2" fill="#14b8a6">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M160,60 L100,108" begin="0.5s" />
          </circle>
        </svg>
        {nodes.map((node, i) => (
          <div
            key={node.label}
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ left: node.x, top: node.y }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border dark:border-white/15 border-(--border-color) dark:bg-gray-950/80 bg-(--bg-surface) animate-[node-glow_4s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.8}s` }}
            >
              <svg className="h-3.5 w-3.5 dark:text-primary-400 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7" />
              </svg>
            </div>
            <span className="text-[7px] font-bold tracking-wider dark:text-gray-500 text-(--text-secondary)">{node.label}</span>
          </div>
        ))}
        <AnimatedCursor className="top-1/2 left-1/3 animate-[cursor-move_4s_ease-in-out_infinite]" />
      </div>
    </CardShell>
  );
}

/* ══════════════════════════════════════════════
   Card 6 — Backup & Security Shield
   ══════════════════════════════════════════════ */
function BackupSecurityCard() {
  const events = [
    { time: "02:00", task: "Full backup completed", status: "ok" },
    { time: "06:15", task: "Threat scan - 0 issues", status: "ok" },
    { time: "09:30", task: "Incremental backup", status: "ok" },
    { time: "12:00", task: "Firewall rules updated", status: "ok" },
  ];

  return (
    <CardShell
      stat="0"
      statLabel="Threats Detected"
      title="Backup & Security"
      desc="Automated backups with layered security protecting your data."
    >
      <div className="relative space-y-1 font-mono">
        {events.map((evt, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-md border dark:border-white/5 border-(--border-color) dark:bg-gray-950/40 bg-(--bg-surface) px-2.5 py-1.5 animate-[row-fade_0.3s_ease-out_both]"
            style={{ animationDelay: `${i * 0.25}s` }}
          >
            <span className="text-[8px] dark:text-gray-600 text-(--text-secondary) tabular-nums">{evt.time}</span>
            <span className="text-[9px] dark:text-gray-300 text-(--text-primary) flex-1">{evt.task}</span>
            <span className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full bg-green-400 animate-[blink_2s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.4}s` }}
              />
              <span className="text-[8px] font-semibold dark:text-green-400 text-green-600 uppercase">{evt.status}</span>
            </span>
          </div>
        ))}
        <AnimatedCursor className="-bottom-1 right-4 animate-[cursor-click_4s_ease-in-out_infinite]" />
      </div>
    </CardShell>
  );
}

/* ══════════════════════════════════════════════
   Card Shell — consistent layout wrapper
   ══════════════════════════════════════════════ */
function CardShell({
  stat,
  statLabel,
  title,
  desc,
  children,
}: {
  stat: string;
  statLabel: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">{children}</div>
      <div className="mx-5 h-px dark:bg-white/5 bg-(--border-color)" />
      <div className="px-5 pb-5 pt-4 mt-auto">
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-extrabold bg-linear-to-r dark:from-primary-400 dark:to-primary-300 from-primary-700 to-primary-600 bg-clip-text text-transparent leading-none">
            {stat}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-widest dark:text-gray-500 text-(--text-secondary)">
            {statLabel}
          </span>
        </div>
        <h3 className="text-base font-bold text-(--text-primary) mt-2">{title}</h3>
        <p className="text-[13px] dark:text-gray-400 text-(--text-secondary) mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Carousel — cycles through all 6 cards
   ══════════════════════════════════════════════ */
const cards = [
  DiagnosticsCard,
  ServerRackCard,
  UptimeCard,
  SupportChatCard,
  NetworkCard,
  BackupSecurityCard,
];

export function ProcessCarousel() {
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    setActive(index);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % cards.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const Card = cards[active];

  return (
    // Decorative mock-UI carousel — hidden from screen readers
    <div aria-hidden="true" className="rounded-2xl border dark:border-white/10 border-(--border-color) dark:bg-gray-900/80 bg-(--bg-primary) backdrop-blur-sm overflow-hidden shadow-2xl dark:shadow-black/20 shadow-slate-200">
      <div
        key={active}
        style={{ animation: "carousel-in 0.4s ease-out both" }}
      >
        <Card />
      </div>

      <div className="flex items-center justify-between border-t dark:border-white/5 border-(--border-color) px-5 py-2.5">
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Show card ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === active
                  ? "w-5 dark:bg-primary-500 bg-primary-600"
                  : "w-1.5 dark:bg-gray-600 dark:hover:bg-gray-500 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => goTo((active - 1 + cards.length) % cards.length)}
            aria-label="Previous card"
            className="flex h-6 w-6 items-center justify-center rounded border dark:border-white/10 border-(--border-color) dark:text-gray-400 text-(--text-secondary) transition-colors dark:hover:bg-white/5 hover:bg-(--bg-surface) dark:hover:text-white hover:text-(--text-primary) cursor-pointer"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => goTo((active + 1) % cards.length)}
            aria-label="Next card"
            className="flex h-6 w-6 items-center justify-center rounded border dark:border-white/10 border-(--border-color) dark:text-gray-400 text-(--text-secondary) transition-colors dark:hover:bg-white/5 hover:bg-(--bg-surface) dark:hover:text-white hover:text-(--text-primary) cursor-pointer"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
