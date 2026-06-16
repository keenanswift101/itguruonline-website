import { Reveal } from "@/components/ui/Reveal";

const items = [
  { label: "Cloud Hosting",          num: "01", desc: "Scalable hosting on reliable servers with 99.9% uptime guaranteed." },
  { label: "Cybersecurity",          num: "02", desc: "Threat detection, firewall management, and endpoint protection." },
  { label: "Server Management",      num: "03", desc: "Proactive monitoring, patching, and maintenance of your servers." },
  { label: "Domain Names",           num: "04", desc: "Register and manage .co.za, .com, .net, and more — all in one place." },
  { label: "Network Infrastructure", num: "05", desc: "Routers, switches, cabling, and Wi-Fi designed for your business." },
  { label: "Data Backup",            num: "06", desc: "Automated off-site backups so your data is safe when it matters most." },
  { label: "Remote Support",         num: "07", desc: "Instant secure remote access — we fix issues without a site visit." },
  { label: "Email & Comms",          num: "08", desc: "Professional email hosting with spam filtering and reliable delivery." },
];

export function TechStack() {
  return (
    <section
      className="relative overflow-hidden py-8 sm:py-12"
      aria-label="Technology expertise"
    >

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <Reveal className="mb-10 text-center">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-400">
            Full-Stack Coverage
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Technologies &amp; Solutions We Work With
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            From cloud platforms to everyday office tools — we support the
            technology stack your business already runs on.
          </p>
        </Reveal>

        {/* Frosted glass grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {items.map((item, i) => (
            <Reveal key={item.label} delayMs={i * 60} className="h-full">
              <div className="group h-full flex flex-col cursor-default rounded-xl border border-white/15 bg-white/12 p-5 backdrop-blur-[20px] transition-all duration-300 hover:border-white/25 hover:bg-white/20">
                <span className="font-mono text-[11px] text-slate-400 transition-colors duration-200 group-hover:text-primary-400">
                  {item.num}
                </span>
                <p className="mt-3 text-sm font-semibold leading-snug text-white transition-colors duration-200 group-hover:text-primary-200">
                  {item.label}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-300 transition-colors duration-200 group-hover:text-slate-200 flex-1">
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Stats */}
        <Reveal className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-16">
          {[
            { value: "50+", label: "Tools & Platforms"  },
            { value: "8",   label: "Core Disciplines"   },
            { value: "10+", label: "Years of Expertise" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </Reveal>

      </div>
    </section>
  );
}
