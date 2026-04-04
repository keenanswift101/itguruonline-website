import Image from "next/image";
import { DomainChecker } from "@/components/forms/DomainChecker";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

const stats = [
  { value: 10, suffix: "+", label: "Years Experience" },
  { value: 500, suffix: "+", label: "Happy Clients" },
  { value: 99.9, suffix: "%", label: "Uptime Guaranteed" },
  { value: 24, suffix: "/7", label: "Support Available" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-gray-900 via-primary-900 to-gray-900">
      {/* ── Dot-grid background ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, #14b8a6 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Ambient blobs ── */}
      <div
        className="absolute top-20 left-[8%] h-72 w-72 rounded-full bg-primary-500/10 blur-3xl animate-float"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-32 right-[12%] h-56 w-56 rounded-full bg-secondary-500/10 blur-3xl animate-float-delayed"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ════════════ Two-column grid ════════════ */}
        <div className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:min-h-[calc(100vh-5rem)] lg:py-20">
          {/* ── Left: Content ── */}
          <div className="text-center lg:text-left">
            {/* Trust badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm font-medium text-primary-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-400" />
              </span>
              Trusted by 500+ South African Businesses
            </div>

            {/* Headline */}
            <h1 className="mt-8 animate-fade-in-up animation-delay-100">
              <span className="block text-4xl font-extrabold tracking-tight leading-[1.1] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Your IT.
              </span>
              <span className="mt-1 block text-4xl font-extrabold tracking-tight leading-[1.1] sm:text-5xl lg:text-6xl xl:text-7xl">
                <span className="bg-linear-to-r from-primary-400 via-primary-300 to-accent-400 bg-clip-text text-transparent">
                  Handled.
                </span>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-300 lg:mx-0 animate-fade-in-up animation-delay-200">
              Domains. Hosting. Support. Networks. — One team, zero headaches.
              We keep the tech running so you can keep your business growing.
            </p>

            {/* Domain Checker */}
            <div className="mx-auto mt-10 max-w-lg lg:mx-0 animate-fade-in-up animation-delay-300">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-400/80">
                Find your perfect domain
              </p>
              <DomainChecker />
            </div>
          </div>

          {/* ── Right: Image showcase ── */}
          <div className="flex justify-center lg:justify-end animate-fade-in-right animation-delay-200">
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
              {/* Glow behind image */}
              <div
                className="absolute -inset-4 rounded-3xl bg-linear-to-tr from-primary-500/20 via-transparent to-accent-500/20 blur-2xl animate-pulse-glow"
                aria-hidden="true"
              />

              {/* Image with diagonal clip */}
              <div
                className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-primary-500/10"
                style={{
                  clipPath:
                    "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)",
                }}
              >
                <Image
                  src="/itguru-img1.png"
                  alt="IT-Guru Online — Professional IT solutions and support"
                  width={600}
                  height={500}
                  priority
                  className="h-auto w-full object-cover"
                />
                {/* Bottom fade */}
                <div
                  className="absolute inset-0 bg-linear-to-t from-gray-900/50 via-transparent to-transparent"
                  aria-hidden="true"
                />
              </div>

              {/* Floating badge — Uptime (top-right) */}
              <div className="absolute -top-3 -right-3 z-10 rounded-2xl border border-white/10 bg-gray-900/80 px-3.5 py-2 shadow-xl backdrop-blur-md animate-float sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/20 sm:h-9 sm:w-9">
                    <svg
                      className="h-4 w-4 text-primary-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white sm:text-sm">
                      99.9%
                    </p>
                    <p className="text-[10px] text-gray-400 sm:text-[11px]">
                      Uptime
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badge — Support (bottom-left) */}
              <div className="absolute -bottom-3 -left-3 z-10 rounded-2xl border border-white/10 bg-gray-900/80 px-3.5 py-2 shadow-xl backdrop-blur-md animate-float-delayed sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/20 sm:h-9 sm:w-9">
                    <svg
                      className="h-4 w-4 text-accent-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white sm:text-sm">
                      24/7
                    </p>
                    <p className="text-[10px] text-gray-400 sm:text-[11px]">
                      Support
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════ Stats Bar ════════════ */}
        <div className="relative pb-12 sm:pb-16 animate-fade-in-up animation-delay-500">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-8">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`text-center ${
                    i < stats.length - 1
                      ? "sm:border-r sm:border-white/10"
                      : ""
                  }`}
                >
                  <div className="text-2xl font-bold text-white sm:text-3xl">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
