import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getMergedCrmRecords } from "@/lib/crm-query";
import { CrmTable } from "@/components/admin/crm/CrmTable";

export const metadata = { title: "CRM — IT-Guru Admin" };

export default async function CrmListPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const items = await getMergedCrmRecords();

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">CRM</h1>
        <a
          href="/api/admin/crm/export"
          className="btn-glass text-sm px-4 py-2 rounded-lg"
        >
          Export CSV
        </a>
      </div>
      <CrmTable records={items} />
    </main>
  );
}
