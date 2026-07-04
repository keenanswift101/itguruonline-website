import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import ChangePasswordForm from "@/components/forms/ChangePasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <main className="p-8">
      <a href="/admin/dashboard" className="text-sm text-(--text-secondary) hover:text-(--text-primary) underline">
        ← Back to Dashboard
      </a>
      <h1 className="text-2xl font-bold text-(--text-primary) mt-2 mb-6">Settings</h1>

      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-8 max-w-md w-full">
        <h2 className="text-lg font-semibold text-(--text-primary) mb-1">Change Password</h2>
        <p className="text-sm text-(--text-secondary) mb-6">
          Signed in as <span className="text-(--text-primary)">{session.email}</span>
        </p>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
