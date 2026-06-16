"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const services = [
  {
    title: "Remote / Online Support",
    description:
      "Secure remote connections for diagnostics, software fixes, and patches — anywhere in the world.",
  },
  {
    title: "Network Solutions",
    description:
      "Routers, switches, ethernet cabling, and WiFi solutions tailored to your business needs.",
  },
  {
    title: "Hardware Procurement",
    description:
      "All major brands — custom-built desktops, servers, laptops, printers, and peripherals.",
  },
  {
    title: "Troubleshooting & Repairs",
    description:
      "Hardware troubleshooting, desktop upgrades, laptop repairs, and system optimisation.",
  },
  {
    title: "Web Hosting & Domains",
    description:
      "Domain registration, Windows & Linux hosting, and full web hosting management.",
  },
  {
    title: "Web Design",
    description:
      "Professional website design and development through our Swift Designz partnership.",
  },
];

const CMD = "run --scan services --verbose";
const PROMPT_SPEED = 52;
const SCAN_SPEED = 20;
const SVC_GAP = 200;

type SvcState = "queued" | "scanning" | "done";

export function ServiceCards() {
  const isDark = true;

  const [cmdLen, setCmdLen] = useState(0);
  const [cmdDone, setCmdDone] = useState(false);
  const [svcStates, setSvcStates] = useState<SvcState[]>(() =>
    services.map(() => "queued"),
  );
  const [typedDescs, setTypedDescs] = useState<number[]>(() =>
    services.map(() => 0),
  );
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const triggered = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function push(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCmdLen(CMD.length);
      setCmdDone(true);
      setSvcStates(services.map(() => "done"));
      setTypedDescs(services.map((s) => s.description.length));
      setPct(100);
      setDone(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || triggered.current) return;
        triggered.current = true;
        let ci = 0;
        const typeCmd = () => {
          setCmdLen(++ci);
          if (ci < CMD.length) push(typeCmd, PROMPT_SPEED);
          else { setCmdDone(true); push(() => scanSvc(0), 500); }
        };
        push(typeCmd, 350);
      },
      { threshold: 0.1 },
    );

    function scanSvc(i: number) {
      if (i >= services.length) {
        setPct(100);
        push(() => setDone(true), 400);
        return;
      }
      setSvcStates((prev) => { const n = [...prev]; n[i] = "scanning"; return n; });
      setPct(Math.round((i / services.length) * 100));

      let dc = 0;
      const typeDesc = () => {
        setTypedDescs((prev) => { const n = [...prev]; n[i] = dc + 1; return n; });
        if (dc + 1 < services[i].description.length) {
          dc++;
          push(typeDesc, SCAN_SPEED);
        } else {
          setSvcStates((prev) => { const n = [...prev]; n[i] = "done"; return n; });
          setPct(Math.round(((i + 1) / services.length) * 100));
          push(() => scanSvc(i + 1), SVC_GAP);
        }
      };
      push(typeDesc, 80);
    }

    obs.observe(el);
    return () => {
      obs.disconnect();
      timers.current.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Terminal colour palette ──────────────────────────────────────────────────
  const tc = isDark
    ? {
        wrap:       "0 25px 50px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)",
        titleBar:   "#1c1c1e",
        titleText:  "#8e8e93",
        body:       "#0d1117",
        panelBdr:   "#30363d",
        statCard:   "#161b22",
        progressBg: "#21262d",
        promptIcon: "#34d399",
        promptName: "#58a6ff",
        promptDim:  "#8b949e",
        promptText: "#e6edf3",
        queued:     "#484f58",
        scanTitle:  "#fef3c7",
        doneTitle:  "#e6edf3",
        desc:       "#8b949e",
        labelDim:   "#8b949e",
        scanBadge:  "#f59e0b",
        doneBadge:  "#10b981",
        scanIcon:   "#fbbf24",
        doneIcon:   "#34d399",
        cursorDesc: "#fbbf24",
      }
    : {
        wrap:       "0 15px 40px -8px rgba(30,64,175,0.18), 0 0 0 1px rgba(30,64,175,0.12)",
        titleBar:   "#1e3a5f",   // deep navy title bar — clearly a terminal
        titleText:  "#93b4d0",
        body:       "#f0f7ff",   // very light blue body — matches page tone
        panelBdr:   "#c3d9ef",
        statCard:   "#dbeafe",   // secondary-100
        progressBg: "#bfdbfe",
        promptIcon: "#0d9488",   // teal
        promptName: "#1d4ed8",   // secondary-700
        promptDim:  "#64748b",
        promptText: "#0f172a",
        queued:     "#94a3b8",
        scanTitle:  "#78350f",   // amber-900 — legible on light bg
        doneTitle:  "#0f172a",
        desc:       "#475569",
        labelDim:   "#64748b",
        scanBadge:  "#b45309",   // amber-700
        doneBadge:  "#047857",   // emerald-700
        scanIcon:   "#d97706",
        doneIcon:   "#059669",
        cursorDesc: "#d97706",
      };

  return (
    <section
      ref={sectionRef}
      className="relative pt-6 pb-8 sm:pt-8 sm:pb-12 overflow-hidden"
    >

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/FullLogo_Transparent.png"
            alt="IT-Guru Online"
            width={360}
            height={120}
            className="h-24 sm:h-32 lg:h-40 w-auto saturate-200 contrast-125"
          />
        </div>

        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How Can We Help?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Retain your core focus — our IT support frees up your time and resources.
          </p>
        </div>

        {/* ═══ Terminal window ═══ */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ boxShadow: tc.wrap }}
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-2 px-4 py-3 select-none"
            style={{ backgroundColor: tc.titleBar }}
          >
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" aria-hidden="true" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" aria-hidden="true" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" aria-hidden="true" />
            <span
              className="ml-3 flex-1 text-center text-xs font-mono tracking-wide"
              style={{ color: tc.titleText }}
            >
              IT-Guru System Scanner — v2.1.0
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  done ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                }`}
              />
              <span
                className={`text-[10px] font-mono font-bold tracking-widest ${
                  done ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {done ? "COMPLETE" : "LIVE"}
              </span>
            </div>
          </div>

          {/* Body — two panels */}
          <div
            className="grid lg:grid-cols-2"
            style={{ backgroundColor: tc.body }}
          >
            {/* ── Left: CLI output ── */}
            <div
              className="p-5 sm:p-7 border-b lg:border-b-0 lg:border-r"
              style={{ borderColor: tc.panelBdr }}
            >
              {/* Shell prompt */}
              <div className="flex items-center gap-1.5 text-sm font-mono flex-wrap">
                <span style={{ color: tc.promptIcon }} className="select-none">⬡</span>
                <span style={{ color: tc.promptName }}>it-guru</span>
                <span style={{ color: tc.promptDim }}>~$</span>
                <span className="ml-1 break-all" style={{ color: tc.promptText }}>
                  {CMD.slice(0, cmdLen)}
                </span>
                {!cmdDone && (
                  <span
                    className="inline-block w-1.75 h-[1em] ml-0.5 align-middle"
                    style={{
                      backgroundColor: tc.promptIcon,
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                )}
              </div>

              {/* Service scan output */}
              {cmdDone && (
                <div className="mt-5 space-y-4 font-mono text-sm">
                  {services.map((svc, i) => {
                    const st = svcStates[i];
                    return (
                      <div key={svc.title}>
                        <div className="flex items-start gap-2.5">
                          <span
                            className="shrink-0 text-xs tabular-nums transition-colors duration-300"
                            style={{
                              color:
                                st === "queued"
                                  ? tc.queued
                                  : st === "scanning"
                                  ? tc.scanIcon
                                  : tc.doneIcon,
                            }}
                          >
                            {st === "queued" ? "[ ]" : st === "scanning" ? "[~]" : "[✓]"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div
                              className="transition-colors duration-300 leading-snug"
                              style={{
                                color:
                                  st === "queued"
                                    ? tc.queued
                                    : st === "scanning"
                                    ? tc.scanTitle
                                    : tc.doneTitle,
                              }}
                            >
                              {st !== "queued" && (
                                <span
                                  className="text-[9px] font-bold tracking-[0.15em] mr-2"
                                  style={{
                                    color:
                                      st === "scanning" ? tc.scanBadge : tc.doneBadge,
                                  }}
                                >
                                  {st === "scanning" ? "SCANNING" : "DETECTED"}
                                </span>
                              )}
                              <span className={st !== "queued" ? "font-semibold" : ""}>
                                {svc.title}
                              </span>
                            </div>
                            {typedDescs[i] > 0 && (
                              <p
                                className="text-xs mt-1 leading-relaxed"
                                style={{ color: tc.desc }}
                              >
                                {svc.description.slice(0, typedDescs[i])}
                                {st === "scanning" && (
                                  <span
                                    className="inline-block w-1.25 h-[0.85em] ml-0.5 align-middle"
                                    style={{
                                      backgroundColor: tc.cursorDesc,
                                      animation: "blink 0.7s step-end infinite",
                                    }}
                                  />
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Progress bar */}
                  {svcStates[0] !== "queued" && (
                    <div className="pt-4" style={{ borderTop: `1px solid ${tc.panelBdr}` }}>
                      <div
                        className="flex justify-between text-[10px] font-mono mb-1.5"
                        style={{ color: tc.labelDim }}
                      >
                        <span>
                          {done
                            ? "Scan complete — 6/6 services detected"
                            : "Scanning infrastructure..."}
                        </span>
                        <span
                          className={done ? "text-emerald-500" : "text-amber-500"}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: tc.progressBg }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: done
                              ? "linear-gradient(90deg, #10b981, #14b8a6)"
                              : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                          }}
                        />
                      </div>
                      {done && (
                        <p
                          className="mt-2 text-[10px] font-mono"
                          style={{ color: tc.doneBadge }}
                        >
                          ✓ All systems operational — no anomalies detected.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: Video (top) + Stats (bottom) ── */}
            <div className="flex flex-col">
              {/* Video */}
              <div className="relative overflow-hidden" style={{ minHeight: "220px", flex: "1 1 0" }}>
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                >
                  <source src="/it_guru_video_2.mp4" type="video/mp4" />
                </video>
              </div>

              {/* Stats counters */}
              <div
                className="p-5 sm:p-6 border-t"
                style={{ borderColor: tc.panelBdr, backgroundColor: tc.body }}
              >
                <div
                  className="text-[9px] font-mono uppercase tracking-widest mb-3"
                  style={{ color: tc.labelDim }}
                >
                  Live Infrastructure Metrics
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 font-mono">
                  {[
                    { label: "UPTIME",     value: "99.9%"   },
                    { label: "RESPONSE",   value: "< 4 hrs" },
                    { label: "CLIENTS",    value: "20+"     },
                    { label: "EXPERIENCE", value: "10+ yrs" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl border px-3 py-3"
                      style={{ backgroundColor: tc.statCard, borderColor: tc.panelBdr }}
                    >
                      <div
                        className="text-[8px] mb-1 tracking-widest uppercase"
                        style={{ color: tc.labelDim }}
                      >
                        {label}
                      </div>
                      <div
                        className="text-xl font-bold"
                        style={{ color: isDark ? "#67e8f9" : "#0e7490" }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span
                    className="text-[10px] font-mono tracking-widest uppercase"
                    style={{ color: tc.doneBadge }}
                  >
                    All systems operational
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
