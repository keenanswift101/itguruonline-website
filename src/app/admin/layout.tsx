import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image
          src="/bg-image.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          aria-hidden="true"
        />
      </div>
      {children}
    </div>
  );
}
