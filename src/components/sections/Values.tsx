const values = [
  {
    title: "Service Excellence",
    description: "We go above and beyond to deliver outstanding IT solutions.",
  },
  {
    title: "Customer Satisfaction",
    description: "Your success is our priority — we're not happy until you are.",
  },
  {
    title: "Integrity & Professionalism",
    description: "Honest, transparent, and reliable in everything we do.",
  },
  {
    title: "Cost-Effective Solutions",
    description: "Enterprise-grade IT support that fits your budget.",
  },
];

export function Values() {
  return (
    <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Our Values
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            What drives us every day
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => (
            <div key={value.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xl font-bold dark:bg-primary-900/30">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{value.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
