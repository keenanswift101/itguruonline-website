import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export const metadata = { title: "Forgot Password — IT-Guru Admin" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-(--text-primary)">IT-Guru Admin</h1>
          <p className="mt-1 text-sm text-(--text-secondary)">Reset your password</p>
        </div>
        <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-8">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-xs text-(--text-secondary)">
          <a href="/admin/login" className="hover:text-(--text-primary) transition-colors">
            Back to login
          </a>
        </p>
      </div>
    </main>
  );
}
