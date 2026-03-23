import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CTABanner() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary-700 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Check if your perfect domain is available and register today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/domain-checker">
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-primary-50"
              >
                Check Domain Availability
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="secondary"
                size="lg"
                className="border-white text-white hover:bg-primary-600"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
