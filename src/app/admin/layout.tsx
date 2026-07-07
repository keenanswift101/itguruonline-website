import Image from "next/image";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <ToastProvider>
      <div className="relative min-h-screen flex">
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
        {session && <AdminSidebar email={session.email} />}
        <main className="flex-1 min-w-0 min-h-screen overflow-y-auto">{children}</main>
      </div>
    </ToastProvider>
  );
}
