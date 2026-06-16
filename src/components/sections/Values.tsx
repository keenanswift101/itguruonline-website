import { Reveal } from "@/components/ui/Reveal";

const accents = [
  {
    hoverBorder: "hover:border-primary-400/40",
    hoverShadow: "hover:shadow-[0_0_30px_-8px_rgba(13,148,136,0.45)]",
  },
  {
    hoverBorder: "hover:border-blue-400/40",
    hoverShadow: "hover:shadow-[0_0_30px_-8px_rgba(59,130,246,0.45)]",
  },
  {
    hoverBorder: "hover:border-amber-400/40",
    hoverShadow: "hover:shadow-[0_0_30px_-8px_rgba(217,119,6,0.45)]",
  },
  {
    hoverBorder: "hover:border-purple-400/40",
    hoverShadow: "hover:shadow-[0_0_30px_-8px_rgba(168,85,247,0.45)]",
  },
];

const values = [
  {
    title: "Service Excellence",
    description: "We go above and beyond to deliver outstanding IT solutions.",
    rating: "5.0",
    label: "Rated 5 / 5",
  },
  {
    title: "Customer Satisfaction",
    description: "Your success is our priority — we're not happy until you are.",
    rating: "5.0",
    label: "Rated 5 / 5",
  },
  {
    title: "Integrity & Professionalism",
    description: "Honest, transparent, and reliable in everything we do.",
    rating: "5.0",
    label: "Rated 5 / 5",
  },
  {
    title: "Cost-Effective Solutions",
    description: "Enterprise-grade IT support that fits your budget.",
    rating: "5.0",
    label: "Rated 5 / 5",
  },
];

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export function Values() {
  return (
    <section className="relative overflow-hidden py-8 sm:py-12" aria-label="Our Values">

      {/* SVG gradient defs — metallic gold stars */}
      <svg aria-hidden="true" className="absolute h-0 w-0 overflow-hidden" focusable="false">
        <defs>
          <linearGradient id="star-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#fff4a8" />
            <stop offset="28%"  stopColor="#ffd700" />
            <stop offset="60%"  stopColor="#b8860b" />
            <stop offset="100%" stopColor="#ffe566" />
          </linearGradient>
        </defs>
      </svg>


      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.3em] text-primary-400">
            ~/core.values
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Our Values
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            What drives us every day
          </p>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-primary-500" />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => {
            const accent = accents[i % accents.length];
            return (
              <Reveal key={value.title} delayMs={i * 80} className="group h-full">
                <div
                  className={`relative h-full overflow-hidden rounded-xl border border-white/15 bg-white/8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 ${accent.hoverBorder} ${accent.hoverShadow}`}
                >
                  {/* Terminal title bar — all three dots the same dark colour */}
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
                        aria-label={value.label}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <svg
                            key={n}
                            className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
                            style={{ transitionDelay: `${n * 30}ms` }}
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path fill="url(#star-gold)" d={STAR_PATH} />
                          </svg>
                        ))}
                      </div>
                      <p className="font-mono text-xs font-bold tracking-wide" style={{ color: "#c8941a" }}>
                        {value.rating} / 5.0
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
  );
}
