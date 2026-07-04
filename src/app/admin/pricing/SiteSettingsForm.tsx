"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SaveState = "idle" | "saving" | "saved" | "error";

async function patch(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return <span className="text-xs text-(--text-secondary)">Saving…</span>;
  }
  if (state === "saved") {
    return <span className="text-xs text-green-400 transition-opacity">Saved ✓</span>;
  }
  if (state === "error") {
    return <span className="text-xs text-red-400">Save failed</span>;
  }
  return null;
}

interface SiteSettingsFormProps {
  settings: Record<string, string>;
}

const SETTINGS_URL = "/api/admin/pricing/settings";

export function SiteSettingsForm({ settings }: SiteSettingsFormProps) {
  const router = useRouter();

  const [contactEmail, setContactEmail] = useState(settings.contact_email ?? "");
  const [feeNote, setFeeNote] = useState(settings.hosting_setup_fee_note ?? "");
  const [enquiryStaleDays, setEnquiryStaleDays] = useState(
    settings.enquiry_stale_days ?? "7"
  );
  const [invoiceOverdueReminderDays, setInvoiceOverdueReminderDays] = useState(
    settings.invoice_overdue_reminder_days ?? "1"
  );
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  function setSaveState(field: string, state: SaveState) {
    setSaveStates((prev) => ({ ...prev, [field]: state }));
  }

  async function save(field: string, body: unknown, newValue: string, originalValue: string) {
    if (newValue === originalValue) return;
    setSaveState(field, "saving");
    const ok = await patch(SETTINGS_URL, body);
    setSaveState(field, ok ? "saved" : "error");
    if (ok) {
      setTimeout(() => setSaveState(field, "idle"), 1500);
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-5 space-y-5">
      {/* Contact email */}
      <div className="space-y-1">
        <label
          htmlFor="contact-email"
          className="block text-xs font-medium text-(--text-secondary) uppercase tracking-wide"
        >
          Contact email
        </label>
        <div className="flex items-center gap-3">
          <input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            onBlur={() =>
              save(
                "contact_email",
                { contact_email: contactEmail },
                contactEmail,
                settings.contact_email ?? ""
              )
            }
            className="w-full max-w-sm rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="owner@it-guru.co.za"
          />
          <SaveIndicator state={saveStates.contact_email ?? "idle"} />
        </div>
        <p className="text-xs text-(--text-secondary)">
          Used in notification emails sent to the admin.
        </p>
      </div>

      {/* Hosting setup fee note */}
      <div className="space-y-1">
        <label
          htmlFor="fee-note"
          className="block text-xs font-medium text-(--text-secondary) uppercase tracking-wide"
        >
          Hosting setup fee note
        </label>
        <div className="flex gap-3">
          <textarea
            id="fee-note"
            value={feeNote}
            onChange={(e) => setFeeNote(e.target.value)}
            onBlur={() =>
              save(
                "hosting_setup_fee_note",
                { hosting_setup_fee_note: feeNote },
                feeNote,
                settings.hosting_setup_fee_note ?? ""
              )
            }
            rows={3}
            className="w-full max-w-lg rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30 resize-y"
            placeholder="e.g. R395 once-off cPanel setup fee applies on first invoice."
          />
          <SaveIndicator state={saveStates.hosting_setup_fee_note ?? "idle"} />
        </div>
        <p className="text-xs text-(--text-secondary)">
          Shown as a note alongside hosting package prices in the registration wizard.
        </p>
      </div>

      {/* Stale enquiry reminder threshold */}
      <div className="space-y-1">
        <label
          htmlFor="enquiry-stale-days"
          className="block text-xs font-medium text-(--text-secondary) uppercase tracking-wide"
        >
          Stale Enquiry Reminder (days)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="enquiry-stale-days"
            type="number"
            min="1"
            value={enquiryStaleDays}
            onChange={(e) => setEnquiryStaleDays(e.target.value)}
            onBlur={() => {
              const value = String(Math.max(1, parseInt(enquiryStaleDays, 10) || 7));
              setEnquiryStaleDays(value);
              save(
                "enquiry_stale_days",
                { enquiry_stale_days: value },
                value,
                settings.enquiry_stale_days ?? "7"
              );
            }}
            className="w-24 rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <SaveIndicator state={saveStates.enquiry_stale_days ?? "idle"} />
        </div>
        <p className="text-xs text-(--text-secondary)">
          Send reminder after this many days without enquiry status change.
        </p>
      </div>

      {/* Overdue invoice reminder threshold */}
      <div className="space-y-1">
        <label
          htmlFor="invoice-overdue-reminder-days"
          className="block text-xs font-medium text-(--text-secondary) uppercase tracking-wide"
        >
          Overdue Invoice Reminder (days)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="invoice-overdue-reminder-days"
            type="number"
            min="1"
            value={invoiceOverdueReminderDays}
            onChange={(e) => setInvoiceOverdueReminderDays(e.target.value)}
            onBlur={() => {
              const value = String(
                Math.max(1, parseInt(invoiceOverdueReminderDays, 10) || 1)
              );
              setInvoiceOverdueReminderDays(value);
              save(
                "invoice_overdue_reminder_days",
                { invoice_overdue_reminder_days: value },
                value,
                settings.invoice_overdue_reminder_days ?? "1"
              );
            }}
            className="w-24 rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <SaveIndicator state={saveStates.invoice_overdue_reminder_days ?? "idle"} />
        </div>
        <p className="text-xs text-(--text-secondary)">
          Send reminder this many days after the invoice due date passes.
        </p>
      </div>
    </div>
  );
}
