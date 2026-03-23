import { Card } from "@/components/ui/Card";

const services = [
  {
    title: "Remote / Online Support",
    description:
      "Secure remote connections for diagnostics, software fixes, and patches — anywhere in the world.",
    icon: "🖥️",
  },
  {
    title: "Network Solutions",
    description:
      "Routers, switches, ethernet cabling, and WiFi solutions tailored to your business needs.",
    icon: "🌐",
  },
  {
    title: "Hardware Procurement",
    description:
      "All major brands — custom-built desktops, servers, laptops, printers, and peripherals.",
    icon: "💻",
  },
  {
    title: "Troubleshooting & Repairs",
    description:
      "Hardware troubleshooting, desktop upgrades, laptop repairs, and system optimisation.",
    icon: "🔧",
  },
  {
    title: "Web Hosting & Domains",
    description:
      "Domain registration, Windows & Linux hosting, and full web hosting management.",
    icon: "🏠",
  },
  {
    title: "Web Design",
    description:
      "Professional website design and development through our Swift Designz partnership.",
    icon: "🎨",
  },
];

export function ServiceCards() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Can We Help?
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Retain your core focus — our IT support frees up your time and
            resources.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title} hover>
              <div className="text-3xl">{service.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                {service.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
