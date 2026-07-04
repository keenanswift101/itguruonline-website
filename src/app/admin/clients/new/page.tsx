import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import ClientForm from "@/components/forms/ClientForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Client" };

export default async function NewClientPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <main className="p-8">
      <p className="mb-4">
        <Link href="/admin/clients" className="text-(--text-secondary) hover:text-(--text-primary) text-sm underline">
          ← Back to Clients
        </Link>
      </p>

      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-8">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-6">New Client</h1>
        <ClientForm />
      </div>
    </main>
  );
}
