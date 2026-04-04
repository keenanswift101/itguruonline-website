import Link from "next/link";

export function CTABanner() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary-700 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Check if your perfect domain is available and register today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/domain-checker"
              className="inline-flex items-center justify-center h-12 px-6 text-base font-medium rounded-lg bg-white text-primary-700 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700"
            >
              Check Domain Availability
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center h-12 px-6 text-base font-medium rounded-lg border-2 border-white text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
