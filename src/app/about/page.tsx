import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CTAPanelBackground } from "@/components/ui/CTAPanelBackground";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about IT-Guru Online — a Kuils River-based IT company delivering service excellence, professional IT support, hosting, and infrastructure solutions across South Africa.",
};

const valueAccents = [
  { hoverBorder: "hover:border-primary-400/60", hoverShadow: "hover:shadow-[0_0_30px_-6px_rgba(13,148,136,0.55)]" },
  { hoverBorder: "hover:border-blue-400/60",    hoverShadow: "hover:shadow-[0_0_30px_-6px_rgba(59,130,246,0.55)]" },
  { hoverBorder: "hover:border-amber-400/60",   hoverShadow: "hover:shadow-[0_0_30px_-6px_rgba(217,119,6,0.55)]" },
  { hoverBorder: "hover:border-purple-400/60",  hoverShadow: "hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.55)]" },
];

const values = [
  {
    title: "Service Excellence",
    description:
      "We hold ourselves to the highest standard in everything we do. From first contact to final resolution, every interaction reflects our commitment to getting things right.",
  },
  {
    title: "Customer Satisfaction",
    description:
      "Our clients' success is our success. We listen to your needs, communicate clearly, and deliver outcomes that genuinely make a difference to your business.",
  },
  {
    title: "Integrity & Professionalism",
    description:
      "We operate with complete transparency. No hidden costs, no jargon — just honest advice and professional service you can rely on.",
  },
  {
    title: "Cost-Effective Solutions",
    description:
      "We believe quality IT support should be accessible to every business. We find the most efficient solutions that deliver real value without breaking your budget.",
  },
];

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

const timeline = [
  {
    period: "Founded",
    description:
      "IT-Guru Online was established in Kuils River to provide local businesses with reliable, affordable IT support and infrastructure.",
  },
  {
    period: "Growth",
    description:
      "Expanded our service offering to include full web hosting, domain registration, and remote support capabilities for clients across South Africa.",
  },
  {
    period: "Partnership",
    description:
      "Formed a strategic partnership with Swift Designz to offer complete web design and development services alongside our hosting and IT support.",
  },
  {
    period: "Today",
    description:
      "Operating as IT-Guru.Online, we continue to grow our client base and invest in automated tools that make domain registration and onboarding seamless.",
  },
];

const stats = [
  { label: "Years in IT", value: 10, suffix: "+", prefix: "", neon: "#2dd4bf" },
  { label: "Clients Served", value: 20, suffix: "+", prefix: "", neon: "#38bdf8" },
  { label: "Service Uptime", value: 99.9, suffix: "%", prefix: "", neon: "#4ade80" },
  { label: "Response Time", value: 4, suffix: "hrs", prefix: "< ", neon: "#a78bfa" },
];

export default function AboutPage() {
  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" aria-hidden="true" priority />
        <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-hidden="true" />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-10 sm:py-14" aria-label="About hero">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <Image
              src="/FullLogo_Transparent.png"
              alt="IT-Guru Online"
              width={360}
              height={120}
              priority
              className="h-20 sm:h-24 w-auto saturate-200 contrast-125"
            />
          </div>
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-400">~/about</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Who We Are</h1>
            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-primary-500" />
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              IT-Guru Online is a proudly South African IT company headquartered in Kuils River,
              Western Cape. We&apos;ve built our reputation on delivering practical, reliable, and
              cost-effective IT solutions to businesses of all sizes.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission */}
      <section className="relative overflow-hidden py-8 sm:py-12" aria-label="Our mission">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-400">~/mission</p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Mission</h2>
              <div className="mt-4 h-1 w-16 rounded-full bg-primary-500" />
              <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                We exist to free businesses from the complexity and distraction of managing their own
                IT infrastructure. Our support packages are designed so that you can retain your
                core focus — doing what you do best — while we handle the technology that keeps
                you running.
              </p>
              <blockquote className="mt-8 border-l-4 border-primary-500 pl-6">
                <p className="text-xl font-medium italic text-white">
                  &ldquo;Retain your Core Focus — Our IT Support packages will free up your time and
                  resources so that you can focus on your core business.&rdquo;
                </p>
              </blockquote>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/services"
                  className="btn-metallic inline-flex h-10 items-center justify-center px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  View Our Services
                </Link>
                <Link
                  href="/contact"
                  className="btn-glass inline-flex h-10 items-center justify-center px-5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  Get in Touch
                </Link>
              </div>
            </Reveal>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {stats.map((stat, i) => (
                <Reveal
                  key={stat.label}
                  delayMs={i * 80}
                  className="flex flex-col justify-between p-3.5 sm:p-4"
                >
                  <p className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
                    {stat.prefix}
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </p>
                  <div
                    className="mt-2 h-0.5 w-full rounded-full"
                    style={{
                      background: stat.neon,
                      boxShadow: `0 0 8px 3px ${stat.neon}80`,
                    }}
                  />
                  <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-300">{stat.label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden py-8 sm:py-12" aria-label="Our values">
        {/* SVG gradient defs — metallic gold stars */}
        <svg aria-hidden="true" className="absolute h-0 w-0 overflow-hidden" focusable="false">
          <defs>
            <linearGradient id="star-gold-about" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#fff4a8" />
              <stop offset="28%"  stopColor="#ffd700" />
              <stop offset="60%"  stopColor="#b8860b" />
              <stop offset="100%" stopColor="#ffe566" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-400">~/our.values</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Values</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary-500" />
            <p className="mt-4 text-lg text-slate-300">The principles that guide every decision we make.</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => {
              const accent = valueAccents[i % valueAccents.length];
              return (
                <Reveal key={value.title} delayMs={i * 80} className="group h-full">
                  <div
                    className={`relative h-full overflow-hidden rounded-xl border border-white/15 bg-white/8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 ${accent.hoverBorder} ${accent.hoverShadow}`}
                  >
                    {/* Terminal title bar */}
                    <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                      <span className="ml-auto font-mono text-[11px] text-slate-400">
                        0x0{i + 1}
                      </span>
                    </div>

                    <div className="p-6">
                      {/* Metallic gold star rating */}
                      <div className="flex flex-col gap-1.5">
                        <div
                          className="flex gap-0.5"
                          style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.55))" }}
                          aria-label="Rated 5 / 5"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <svg
                              key={n}
                              className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
                              style={{ transitionDelay: `${n * 30}ms` }}
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path fill="url(#star-gold-about)" d={STAR_PATH} />
                            </svg>
                          ))}
                        </div>
                        <p className="font-mono text-xs font-bold tracking-wide" style={{ color: "#c8941a" }}>
                          5.0 / 5.0
                        </p>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-white">{value.title}</h3>
                      <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="relative overflow-hidden py-8 sm:py-12" aria-label="Our journey">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-400">~/journey</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Journey</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary-500" />
            <p className="mt-4 text-lg text-slate-300">
              From a local IT support operation to a full-service digital infrastructure provider.
            </p>
          </Reveal>
          <div className="mt-12 relative">
            <div
              className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#00aaff]/30 sm:left-1/2 sm:-translate-x-1/2"
              aria-hidden="true"
            />
            <div className="space-y-8 sm:space-y-10">
              {timeline.map((item, index) => (
                <Reveal
                  key={item.period}
                  delayMs={index * 100}
                  className={`relative flex gap-6 sm:gap-8 ${index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}
                >
                  <div className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 z-10">
                    <div className="h-3 w-3 rounded-full bg-[#00aaff] shadow-[0_0_10px_3px_rgba(0,170,255,0.75)]" />
                  </div>
                  <div className={`ml-12 sm:ml-0 sm:w-1/2 ${index % 2 === 0 ? "sm:pr-10" : "sm:pl-10"}`}>
                    <div className="group rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#00aaff]/60 hover:shadow-[0_0_24px_-6px_rgba(0,170,255,0.5)]">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-1">
                        {item.period}
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block sm:w-1/2" />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership */}
      <section className="relative overflow-hidden py-10 sm:py-14" aria-label="Swift Designz partnership">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-2xl px-6 py-12 sm:px-12 sm:py-16 text-center">
            <CTAPanelBackground />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                In Partnership with Swift Designz
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-secondary-100 text-lg">
                Our strategic partnership with Swift Designz means you get the best of both worlds —
                world-class web design and development, backed by robust hosting and IT infrastructure.
                One team, one solution, one point of contact.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/services#web-design"
                  className="inline-flex items-center justify-center h-10 px-4 text-base font-medium rounded-[10px] bg-white text-secondary-700 hover:bg-secondary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-secondary-700"
                >
                  Web Design Services
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center h-10 px-4 text-base font-medium rounded-[10px] border-2 border-white text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-secondary-700"
                >
                  Start a Project
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
