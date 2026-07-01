import ResetPasswordForm from "@/components/forms/ResetPasswordForm";

export const metadata = { title: "Reset Password — IT-Guru Admin" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-(--text-primary)">IT-Guru Admin</h1>
          <p className="mt-1 text-sm text-(--text-secondary)">Set a new password</p>
        </div>
        <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-8">
          <ResetPasswordForm token={token ?? ""} />
        </div>
      </div>
    </main>
  );
}
