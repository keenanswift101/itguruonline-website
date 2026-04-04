"use client";

/* ────────────────────────────────────────────────────────────
   ProcessCards — 3 animated cards showcasing IT Guru's process
   Inspired by: step-flow | monitoring dashboard | support chat
   ──────────────────────────────────────────────────────────── */

/* ═══ Card 1 — Process Flow ═══ */
function ProcessFlowCard() {
  const steps = ["ASSESS", "DIAGNOSE", "FIX", "VERIFY"];

  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur-sm overflow-hidden transition-colors hover:border-primary-500/30">
      {/* Illustration */}
      <div className="relative flex flex-col items-center gap-5 px-6 pt-8 pb-6">
        {/* Step circles + connecting lines */}
        <div className="flex items-center justify-between w-full max-w-[280px]">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative h-8 w-8 rounded-full border-2 border-primary-500/40 flex items-center justify-center animate-[step-pulse_4s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 1}s` }}
                >
                  <div
                    className="h-3 w-3 rounded-full bg-primary-500 opacity-30 animate-[step-fill_4s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 1}s` }}
                  />
                </div>
                <span className="text-[9px] font-semibold tracking-wider text-gray-500">
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-1 h-0.5 w-6 sm:w-8 overflow-hidden rounded-full bg-gray-700 mb-5">
                  <div
                    className="h-full bg-primary-500 animate-[line-fill_4s_ease-in-out_infinite] origin-left"
                    style={{ animationDelay: `${i * 1 + 0.5}s` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Info pill */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-widest text-gray-400">
            AVG RESOLUTION · &lt; 4H
          </span>
        </div>
      </div>

      {/* Stats + copy */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-4xl font-extrabold bg-linear-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
            &lt; 4h
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Resolution Time
          </span>
        </div>
        <h3 className="text-lg font-bold text-white mt-2">Rapid Resolution</h3>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          Swift issue resolution without compromising on quality or thoroughness.
        </p>
        <div className="mt-4 h-0.5 w-16 rounded-full bg-primary-500/60" />
      </div>
    </article>
  );
}

/* ═══ Card 2 — Monitoring Dashboard ═══ */
function MonitorDashboardCard() {
  const servers = [
    { name: "Web Server", status: "online" },
    { name: "DB Cluster", status: "online" },
    { name: "Mail Server", status: "online" },
  ];

  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur-sm overflow-hidden transition-colors hover:border-primary-500/30">
      {/* Illustration — monitor window */}
      <div className="px-6 pt-8 pb-6">
        <div className="rounded-lg border border-white/10 bg-gray-950/80 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
            <span className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-primary-500/60" />
              <span className="h-2 w-2 rounded-full bg-primary-500/30" />
            </span>
            <span className="ml-auto text-[9px] font-mono text-gray-600">it-guru.monitor</span>
          </div>
          {/* Dashboard body */}
          <div className="p-3 space-y-2.5">
            {servers.map((srv, i) => (
              <div key={srv.name} className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-400">{srv.name}</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-green-400 animate-[blink_3s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 0.4}s` }}
                  />
                  <span className="text-[9px] font-semibold uppercase text-green-400">{srv.status}</span>
                </div>
              </div>
            ))}
            {/* Uptime bar */}
            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-semibold text-gray-500">UPTIME</span>
                <span className="text-[9px] font-bold text-primary-400">99.9%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full w-[99.9%] rounded-full bg-linear-to-r from-primary-600 to-primary-400 animate-[bar-fill_2s_ease-out_forwards]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + copy */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-4xl font-extrabold bg-linear-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
            99.9%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Guaranteed Uptime
          </span>
        </div>
        <h3 className="text-lg font-bold text-white mt-2">Proactive Monitoring</h3>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          24/7 infrastructure monitoring to prevent issues before they happen.
        </p>
        <div className="mt-4 h-0.5 w-16 rounded-full bg-primary-500/60" />
      </div>
    </article>
  );
}

/* ═══ Card 3 — Support Chat ═══ */
function SupportChatCard() {
  const messages = [
    { from: "client", text: "Our server is down! 🔴", delay: 0 },
    { from: "support", text: "On it! Checking now…", delay: 1 },
    { from: "client", text: "Can't access shared drives 😤", delay: 2 },
    { from: "support", text: "Resolved & verified ✓", delay: 3 },
  ];

  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur-sm overflow-hidden transition-colors hover:border-primary-500/30">
      {/* Illustration — chat window */}
      <div className="px-6 pt-8 pb-6">
        <div className="rounded-lg border border-white/10 bg-gray-950/80 overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-2.5 border-b border-white/5 px-3 py-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-[8px] font-bold text-white">
              IG
            </div>
            <span className="text-[10px] font-semibold text-gray-300">IT Guru Support</span>
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          {/* Messages */}
          <div className="p-3 space-y-2 min-h-[110px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "support" ? "justify-end" : "justify-start"} animate-[chat-in_0.4s_ease-out_both]`}
                style={{ animationDelay: `${msg.delay * 1.4}s` }}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-1.5 text-[10px] leading-relaxed ${
                    msg.from === "support"
                      ? "bg-primary-600/20 border border-primary-500/30 text-primary-200"
                      : "bg-white/5 border border-white/10 text-gray-300"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats + copy */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-4xl font-extrabold bg-linear-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
            24/7
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Always Here
          </span>
        </div>
        <h3 className="text-lg font-bold text-white mt-2">Dedicated Support</h3>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          Ongoing support and communication throughout your IT journey.
        </p>
        <div className="mt-4 h-0.5 w-16 rounded-full bg-primary-500/60" />
      </div>
    </article>
  );
}

/* ═══ Exported grid ═══ */
export function ProcessCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ProcessFlowCard />
      <MonitorDashboardCard />
      <SupportChatCard />
    </div>
  );
}
