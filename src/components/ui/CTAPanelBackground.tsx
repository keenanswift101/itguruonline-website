import Image from "next/image";

// Server/data-center photo + blue gradient overlay shared by the site's CTA panels.
export function CTAPanelBackground() {
  return (
    <>
      <Image
        src="/itguru-img3.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="object-cover object-center"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-linear-to-br from-secondary-900/80 via-secondary-800/60 to-secondary-900/50"
        aria-hidden="true"
      />
    </>
  );
}
