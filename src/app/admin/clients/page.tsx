import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getClients } from "@/lib/client-query";
import { ClientsTable } from "@/components/admin/clients/ClientsTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients — IT-Guru Admin" };

export default async function ClientsListPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const items = await getClients();

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">Clients</h1>
        <Link href="/admin/clients/new" className="btn-metallic text-sm px-4 py-2 rounded-lg">
          New Client
        </Link>
      </div>
      <ClientsTable records={items} />
    </main>
  );
}
