import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about IT-Guru Online — a Kuils River-based IT company delivering service excellence, professional IT support, hosting, and infrastructure solutions across South Africa.",
};

const values = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
    title: "Service Excellence",
    description:
      "We hold ourselves to the highest standard in everything we do. From first contact to final resolution, every interaction reflects our commitment to getting things right.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
    title: "Customer Satisfaction",
    description:
      "Our clients' success is our success. We listen to your needs, communicate clearly, and deliver outcomes that genuinely make a difference to your business.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Integrity & Professionalism",
    description:
      "We operate with complete transparency. No hidden costs, no jargon — just honest advice and professional service you can rely on.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
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
    <>
      {/* Hero */}
      <section className="bg-(--bg-secondary) py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Who We Are
            </h1>
            <p className="mt-6 text-lg text-(--text-secondary) leading-relaxed">
              IT-Guru Online is a proudly South African IT company headquartered in Kuils River,
              Western Cape. We&apos;ve built our reputation on delivering practical, reliable, and
              cost-effective IT solutions to businesses of all sizes.
            </p>
          </div>
        </div>
      </section>

      {/* Mission statement */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Our Mission
              </h2>
              <p className="mt-6 text-lg text-(--text-secondary) leading-relaxed">
                We exist to free businesses from the complexity and distraction of managing their own
                IT infrastructure. Our support packages are designed so that you can retain your
                core focus — doing what you do best — while we handle the technology that keeps
                you running.
              </p>
              <blockquote className="mt-8 border-l-4 border-primary-700 pl-6">
                <p className="text-xl font-medium italic">
                  &ldquo;Retain your Core Focus — Our IT Support packages will free up your time and
                  resources so that you can focus on your core business.&rdquo;
                </p>
              </blockquote>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button href="/services">View Our Services</Button>
                <Button variant="secondary" href="/contact">Get in Touch</Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Years in IT", value: "10+" },
                { label: "Clients Served", value: "200+" },
                { label: "Service Uptime", value: "99.9%" },
                { label: "Response Time", value: "< 4hrs" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-(--border-color) bg-(--bg-primary) p-6 text-center"
                >
                  <p className="text-4xl font-extrabold text-primary-700">{stat.value}</p>
                  <p className="mt-1 text-sm text-(--text-secondary)">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-(--bg-secondary) py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Values</h2>
            <p className="mt-4 text-lg text-(--text-secondary)">
              The principles that guide every decision we make.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-(--border-color) bg-(--bg-primary) p-6"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700/10 text-primary-700 mb-4">
                  {value.icon}
                </div>
                <h3 className="font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm text-(--text-secondary) leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our journey */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Journey</h2>
            <p className="mt-4 text-lg text-(--text-secondary)">
              From a local IT support operation to a full-service digital infrastructure provider.
            </p>
          </div>
          <div className="mt-12 relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-(--border-color) sm:left-1/2 sm:-translate-x-1/2" aria-hidden="true" />
            <div className="space-y-10">
              {timeline.map((item, index) => (
                <div
                  key={item.period}
                  className={`relative flex gap-6 sm:gap-8 ${index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 -translate-y-0 z-10">
                    <div className="h-3 w-3 rounded-full bg-primary-700 ring-2 ring-primary-700/30" />
                  </div>
                  {/* Content */}
                  <div className={`ml-12 sm:ml-0 sm:w-1/2 ${index % 2 === 0 ? "sm:pr-10" : "sm:pl-10"}`}>
                    <div className="rounded-2xl border border-(--border-color) bg-(--bg-primary) p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 mb-1">
                        {item.period}
                      </p>
                      <p className="text-sm text-(--text-secondary) leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {/* Spacer for alternating layout */}
                  <div className="hidden sm:block sm:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership section */}
      <section className="bg-(--bg-secondary) py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary-700 px-8 py-12 sm:px-12 sm:py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              In Partnership with Swift Designz
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-teal-100 text-lg">
              Our strategic partnership with Swift Designz means you get the best of both worlds —
              world-class web design and development, backed by robust hosting and IT infrastructure.
              One team, one solution, one point of contact.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                href="/services#web-design"
                className="bg-white text-primary-700 hover:bg-teal-50 border-0 focus:ring-white"
              >
                Web Design Services
              </Button>
              <Button
                href="/contact"
                className="border-white text-white hover:bg-teal-600 bg-transparent border focus:ring-white"
              >
                Start a Project
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
