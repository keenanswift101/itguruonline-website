import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import InvoiceForm from "@/components/forms/InvoiceForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Invoice" };

export default async function NewInvoicePage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <main className="p-8">
      <p className="mb-4">
        <Link href="/admin/invoices" className="text-(--text-secondary) hover:text-(--text-primary) text-sm underline">
          ← Back to Invoices
        </Link>
      </p>

      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-8">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-6">New Invoice</h1>
        <InvoiceForm />
      </div>
    </main>
  );
}
