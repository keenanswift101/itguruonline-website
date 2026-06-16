import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CTAPanelBackground } from "@/components/ui/CTAPanelBackground";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about IT-Guru Online — a Kuils River-based IT company delivering service excellence, professional IT support, hosting, and infrastructure solutions across South Africa.",
};

const valueAccents = [
  { hoverBorder: "hover:border-primary-400/40", hoverShadow: "hover:shadow-[0_0_30px_-8px_rgba(13,148,136,0.35)]" },
  { hoverBorder: "hover:border-blue-400/40",    hoverShadow: "hover:shadow-[0_0_30px_-8px_rgba(59,130,246,0.35)]" },
  { hoverBorder: "hover:border-amber-400/40",   hoverShadow: "hover:shadow-[0_0_30px_-8px_rgba(217,119,6,0.35)]" },
  { hoverBorder: "hover:border-purple-400/40",  hoverShadow: "hover:shadow-[0_0_30px_-8px_rgba(168,85,247,0.35)]" },
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

export default function AboutPage() {
  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" aria-hidden="true" priority />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24" aria-label="About hero">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
      <section className="relative overflow-hidden py-16 sm:py-24" aria-label="Our mission">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">~/mission</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Mission</h2>
              <div className="mt-4 h-1 w-16 rounded-full bg-primary-500" />
              <p className="mt-6 text-lg text-(--text-secondary) leading-relaxed">
                We exist to free businesses from the complexity and distraction of managing their own
                IT infrastructure. Our support packages are designed so that you can retain your
                core focus — doing what you do best — while we handle the technology that keeps
                you running.
              </p>
              <blockquote className="mt-8 border-l-4 border-primary-500 pl-6">
                <p className="text-xl font-medium italic">
                  &ldquo;Retain your Core Focus — Our IT Support packages will free up your time and
                  resources so that you can focus on your core business.&rdquo;
                </p>
              </blockquote>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center h-10 px-4 text-base font-medium rounded-[10px] bg-primary-700 text-white hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  View Our Services
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center h-10 px-4 text-base font-medium rounded-[10px] border border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Get in Touch
                </Link>
              </div>
            </Reveal>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Years in IT",      value: "10+"   },
                { label: "Clients Served",   value: "20+"   },
                { label: "Service Uptime",   value: "99.9%" },
                { label: "Response Time",    value: "< 4hrs" },
              ].map((stat, i) => (
                <Reveal
                  key={stat.label}
                  delayMs={i * 80}
                  className="rounded-2xl border border-(--border-color) bg-(--bg-primary) p-6 text-center"
                >
                  <p className="text-4xl font-extrabold text-primary-600 dark:text-primary-400">{stat.value}</p>
                  <p className="mt-1 text-sm text-(--text-secondary)">{stat.label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden py-16 sm:py-24" aria-label="Our values">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">~/our.values</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Values</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary-500" />
            <p className="mt-4 text-lg text-(--text-secondary)">The principles that guide every decision we make.</p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => {
              const accent = valueAccents[i % valueAccents.length];
              return (
                <Reveal
                  key={value.title}
                  delayMs={i * 80}
                  className={`rounded-2xl border border-(--border-color) bg-(--bg-primary) p-6 transition-all duration-300 hover:-translate-y-1.5 ${accent.hoverBorder} ${accent.hoverShadow}`}
                >
                  <h3 className="font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm text-(--text-secondary) leading-relaxed">{value.description}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="relative overflow-hidden py-16 sm:py-24" aria-label="Our journey">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">~/journey</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Journey</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary-500" />
            <p className="mt-4 text-lg text-(--text-secondary)">
              From a local IT support operation to a full-service digital infrastructure provider.
            </p>
          </Reveal>
          <div className="mt-12 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-(--border-color) sm:left-1/2 sm:-translate-x-1/2" aria-hidden="true" />
            <div className="space-y-10">
              {timeline.map((item, index) => (
                <Reveal
                  key={item.period}
                  delayMs={index * 100}
                  className={`relative flex gap-6 sm:gap-8 ${index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}
                >
                  <div className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 z-10">
                    <div className="h-3 w-3 rounded-full bg-primary-500 ring-2 ring-primary-500/30" />
                  </div>
                  <div className={`ml-12 sm:ml-0 sm:w-1/2 ${index % 2 === 0 ? "sm:pr-10" : "sm:pl-10"}`}>
                    <div className="rounded-2xl border border-(--border-color) bg-(--bg-primary) p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
                        {item.period}
                      </p>
                      <p className="text-sm text-(--text-secondary) leading-relaxed">{item.description}</p>
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
      <section className="relative overflow-hidden py-16 sm:py-24" aria-label="Swift Designz partnership">
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
