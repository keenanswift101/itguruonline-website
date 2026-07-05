"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ClientPicker } from "@/components/forms/ClientPicker";
import type { ClientPickerOption } from "@/lib/client-types";

interface LineItemRow {
  description: string;
  quantity: number;
  unitPriceRands: number;
}

interface ClientFields {
  clientName: string;
  clientEmail: string;
  billingAddress: string;
  issueDate: string;
  dueDate: string;
}

interface FieldErrors {
  clientName?: string;
  clientEmail?: string;
  billingAddress?: string;
  issueDate?: string;
  dueDate?: string;
  lineItems?: string;
}

interface InvoiceFormInitial extends ClientFields {
  lineItems: LineItemRow[];
}

interface InvoiceFormProps {
  /** When set, the form edits an existing Draft invoice (PUT) instead of creating one (POST). */
  invoiceId?: number;
  /** Prefill values for edit mode. */
  initial?: InvoiceFormInitial;
  /** Stored clients for the searchable picker (INVOICE-09). Omitted/empty hides the picker. */
  clients?: ClientPickerOption[];
  /** Pre-selects the currently-linked client when editing a draft. */
  initialClientId?: number | null;
}

const emptyLineItem = (): LineItemRow => ({ description: "", quantity: 1, unitPriceRands: 0 });

const initialClientFields: ClientFields = {
  clientName: "",
  clientEmail: "",
  billingAddress: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
};

function lineTotal(item: LineItemRow): number {
  return (Number.isFinite(item.quantity) ? item.quantity : 0) * (Number.isFinite(item.unitPriceRands) ? item.unitPriceRands : 0);
}

export default function InvoiceForm({ invoiceId, initial, clients, initialClientId }: InvoiceFormProps) {
  const id = useId();
  const router = useRouter();

  const [fields, setFields] = useState<ClientFields>(
    initial
      ? {
          clientName: initial.clientName,
          clientEmail: initial.clientEmail,
          billingAddress: initial.billingAddress,
          issueDate: initial.issueDate,
          dueDate: initial.dueDate,
        }
      : initialClientFields
  );
  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    initial?.lineItems.length ? initial.lineItems : [emptyLineItem()]
  );
  const [clientId, setClientId] = useState<number | null>(initialClientId ?? null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  function handleClientSelect(client: ClientPickerOption | null) {
    setClientId(client ? client.id : null);
    if (client) {
      setFields((prev) => ({
        ...prev,
        clientName: client.name,
        clientEmail: client.email,
        billingAddress: client.physicalAddress || client.postalAddress || prev.billingAddress,
      }));
    }
  }

  const invoiceTotal = lineItems.reduce((sum, item) => sum + lineTotal(item), 0);

  function handleFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleLineItemChange(index: number, key: keyof LineItemRow, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (key === "description") return { ...item, description: value };
        const num = Number(value);
        return { ...item, [key]: Number.isFinite(num) ? num : 0 };
      })
    );
    if (errors.lineItems) {
      setErrors((prev) => ({ ...prev, lineItems: undefined }));
    }
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!fields.clientName.trim()) errs.clientName = "Client name is required.";
    if (!fields.dueDate.trim()) errs.dueDate = "Due date is required.";
    if (lineItems.some((item) => item.quantity < 1)) {
      errs.lineItems = "Each line item quantity must be at least 1.";
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStatus("submitting");
    setErrors({});
    setServerMessage("");

    const body = JSON.stringify({
      clientId,
      clientName: fields.clientName,
      clientEmail: fields.clientEmail,
      billingAddress: fields.billingAddress,
      issueDate: fields.issueDate,
      dueDate: fields.dueDate,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceRands: item.unitPriceRands,
      })),
    });

    try {
      const res = invoiceId
        ? await fetch(`/api/admin/invoices/${invoiceId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body,
          })
        : await fetch("/api/admin/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        router.push(`/admin/invoices/${(data as { id: number }).id}`);
        return;
      }

      if (res.ok && invoiceId) {
        // Edit mode: stay on the detail page, just revalidate server data.
        setStatus("idle");
        router.refresh();
        return;
      }

      if (res.status === 409) {
        setStatus("error");
        setServerMessage("This invoice can no longer be edited.");
        return;
      }

      if (res.status === 422) {
        const fieldErrs = (data as { fields?: Record<string, string[]> }).fields ?? {};
        const mapped: FieldErrors = {};
        for (const [key, msgs] of Object.entries(fieldErrs)) {
          if (msgs?.length) mapped[key as keyof FieldErrors] = msgs[0];
        }
        setErrors(mapped);
        setStatus("error");
        setServerMessage((data as { error?: string }).error ?? "Please fix the highlighted fields.");
        return;
      }

      setStatus("error");
      setServerMessage((data as { error?: string }).error ?? "An unexpected error occurred. Please try again.");
    } catch {
      setStatus("error");
      setServerMessage(
        invoiceId
          ? "Unable to save changes. Please check your connection and try again."
          : "Unable to create the invoice. Please check your connection and try again."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={status === "submitting"} className="space-y-6">
      {status === "error" && serverMessage && (
        <div
          role="alert"
          className="rounded-lg bg-red-950/30 border border-red-800 px-4 py-3 text-sm text-red-300"
        >
          {serverMessage}
        </div>
      )}

      {/* Client info */}
      {clients && clients.length > 0 && (
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-(--text-primary) mb-1.5">Client</label>
          <ClientPicker clients={clients} selectedClientId={clientId} onSelect={handleClientSelect} />
          <p className="mt-1 text-xs text-(--text-secondary)">Pick a stored client to auto-fill, or choose one-off. Fields stay editable.</p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-clientName`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
            Client Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-clientName`}
            name="clientName"
            type="text"
            value={fields.clientName}
            onChange={handleFieldChange}
            aria-describedby={errors.clientName ? `${id}-clientName-error` : undefined}
            aria-invalid={!!errors.clientName}
            className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors ${
              errors.clientName ? "border-red-500 focus:ring-red-500" : "border-(--border-color)"
            }`}
          />
          {errors.clientName && (
            <p id={`${id}-clientName-error`} role="alert" className="mt-1 text-xs text-red-400">
              {errors.clientName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-clientEmail`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
            Client Email <span className="text-(--text-secondary) font-normal text-xs">(optional)</span>
          </label>
          <input
            id={`${id}-clientEmail`}
            name="clientEmail"
            type="email"
            value={fields.clientEmail}
            onChange={handleFieldChange}
            className="h-10 w-full rounded-lg border border-(--border-color) px-3 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-billingAddress`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
          Billing Address <span className="text-(--text-secondary) font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id={`${id}-billingAddress`}
          name="billingAddress"
          rows={3}
          value={fields.billingAddress}
          onChange={handleFieldChange}
          className="w-full rounded-lg border border-(--border-color) px-3 py-2.5 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] resize-y transition-colors"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-issueDate`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
            Issue Date
          </label>
          <input
            id={`${id}-issueDate`}
            name="issueDate"
            type="date"
            value={fields.issueDate}
            onChange={handleFieldChange}
            className="h-10 w-full rounded-lg border border-(--border-color) px-3 text-sm bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors"
          />
        </div>

        <div>
          <label htmlFor={`${id}-dueDate`} className="block text-sm font-medium text-(--text-primary) mb-1.5">
            Due Date <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-dueDate`}
            name="dueDate"
            type="date"
            value={fields.dueDate}
            onChange={handleFieldChange}
            aria-describedby={errors.dueDate ? `${id}-dueDate-error` : undefined}
            aria-invalid={!!errors.dueDate}
            className={`h-10 w-full rounded-lg border px-3 text-sm bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors ${
              errors.dueDate ? "border-red-500 focus:ring-red-500" : "border-(--border-color)"
            }`}
          />
          {errors.dueDate && (
            <p id={`${id}-dueDate-error`} role="alert" className="mt-1 text-xs text-red-400">
              {errors.dueDate}
            </p>
          )}
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-(--text-primary)">Line Items</h2>
          <button type="button" onClick={addLineItem} className="btn-glass text-xs px-3 py-1.5 rounded-lg">
            Add Item
          </button>
        </div>

        {errors.lineItems && (
          <p role="alert" className="mb-2 text-xs text-red-400">
            {errors.lineItems}
          </p>
        )}

        <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border-color) text-left text-(--text-secondary)">
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium w-24">Qty</th>
                <th className="px-3 py-2 font-medium w-32">Unit Price (R)</th>
                <th className="px-3 py-2 font-medium w-28">Total</th>
                <th className="px-3 py-2 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index} className="border-b border-(--border-color) last:border-b-0">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                      placeholder="Description"
                      className="h-9 w-full rounded-lg border border-(--border-color) px-2 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                      className="h-9 w-full rounded-lg border border-(--border-color) px-2 text-sm bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={item.unitPriceRands}
                      onChange={(e) => handleLineItemChange(index, "unitPriceRands", e.target.value)}
                      className="h-9 w-full rounded-lg border border-(--border-color) px-2 text-sm bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors"
                    />
                  </td>
                  <td className="px-3 py-2 text-(--text-primary)">R{lineTotal(item)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="text-(--text-secondary) hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-xs underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-3">
          <p className="text-(--text-primary) font-semibold text-base">
            Invoice Total: <span>R{invoiceTotal}</span>
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-metallic text-sm px-6 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {invoiceId
          ? status === "submitting"
            ? "Saving…"
            : "Save Changes"
          : status === "submitting"
            ? "Creating…"
            : "Create Invoice"}
      </button>
    </form>
  );
}
