import Image from "next/image";
import Link from "next/link";
import { DomainChecker } from "@/components/forms/DomainChecker";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ProcessCarousel } from "@/components/ui/ProcessCards";

const stats = [
  { value: 10, suffix: "+", label: "Years" },
  { value: 500, suffix: "+", label: "Clients" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 24, suffix: "/7", label: "Support" },
];

export function Hero() {
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

      {/* ── Lighter overlay ── */}
      <div
        className="absolute inset-0 bg-linear-to-b from-gray-900/60 via-gray-900/50 to-gray-900/70"
        aria-hidden="true"
      />
      {/* Teal accent bleed along the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-primary-900/20 to-transparent"
        aria-hidden="true"
      />

      {/* ── Content ── */}
      <div className="relative flex flex-col justify-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
          {/* ═══ Two-column split ═══ */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* ── Left: Content ── */}
            <div className="animate-fade-in-up">
              <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                IT Solutions
                <br />
                <span className="bg-linear-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                  That Simply Work.
                </span>
              </h1>

              {/* Accent rule */}
              <div className="mt-6 h-1 w-20 rounded-full bg-primary-500 animation-delay-100" />

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-200 animate-fade-in-up animation-delay-200">
                Domains. Hosting. Networks. Support. — We handle the technology
                so you can focus on growing your business.
              </p>

              {/* Domain Checker */}
              <div className="mt-8 max-w-lg animate-fade-in-up animation-delay-300">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-400/70">
                  Find your perfect domain
                </p>
                <DomainChecker />
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up animation-delay-400">
                <Link
                  href="/services"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-600 px-7 text-base font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Explore Services
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Get in Touch
                </Link>
              </div>
            </div>

            {/* ── Right: Process carousel ── */}
            <div className="hidden lg:block animate-fade-in-right animation-delay-200">
              <ProcessCarousel />
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="relative mt-auto border-t border-white/10 bg-gray-900/50 backdrop-blur-sm animate-fade-in-up animation-delay-500">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center gap-0.5 ${
                  i < stats.length - 1 ? "border-r border-white/10 pr-6 sm:pr-10" : ""
                }`}
              >
                <span className="text-xl font-bold text-white sm:text-2xl">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 sm:text-xs">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
