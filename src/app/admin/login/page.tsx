import AdminLoginForm from "@/components/forms/AdminLoginForm";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-(--text-primary)">IT-Guru Admin</h1>
        </div>
        <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-8">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
