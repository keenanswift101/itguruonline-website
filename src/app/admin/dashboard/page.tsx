import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <main className="p-8">
      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-2">Admin Dashboard</h1>
        <p className="text-(--text-secondary) text-sm">
          Logged in as <span className="text-(--text-primary) font-medium">{session.email}</span>
        </p>
        <p className="mt-4">
          <a href="/admin/crm" className="text-(--text-primary) underline text-sm">Go to CRM →</a>
        </p>
      </div>
    </main>
  );
}
