import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getClientsForPicker } from "@/lib/client-query";
import QuotationForm from "@/components/forms/QuotationForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Quotation" };

export default async function NewQuotationPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const clients = await getClientsForPicker();

  return (
    <main className="p-8">
      <p className="mb-4">
        <Link href="/admin/quotations" className="text-(--text-secondary) hover:text-(--text-primary) text-sm underline">
          ← Back to Quotations
        </Link>
      </p>

      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-8">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-6">New Quotation</h1>
        <QuotationForm clients={clients} />
      </div>
    </main>
  );
}
