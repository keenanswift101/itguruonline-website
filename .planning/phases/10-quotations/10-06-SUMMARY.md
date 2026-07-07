---
phase: 10-quotations
plan: 06
subsystem: admin-ui
tags: [quotations, status-actions, detail-page, checkpoint-approved]

# Dependency graph
requires:
  - phase: 10-04
    provides: quotation status/resend/convert routes
  - phase: 10-05
    provides: QuotationForm (reused in edit mode), list page
provides:
  - src/components/forms/QuotationStatusActions.tsx — lifecycle buttons (Mark Sent, Accept/Decline, Resend, Revert, Convert to Invoice / View Invoice)
  - src/app/admin/quotations/[id]/page.tsx — detail page (draft = editable QuotationForm; sent/accepted/declined = read-only; QUO-#### ref, valid-until, status badge, line items, download-PDF link)
affects: [phase-10-complete]

# Tech tracking
key-files:
  created:
    - src/components/forms/QuotationStatusActions.tsx
    - src/app/admin/quotations/[id]/page.tsx
key-decisions:
  - "Detail page mirrors invoices/[id]/page.tsx (requireAdmin + notFound, edit-in-place for drafts, read-only otherwise); Date fields serialized to strings for the client component"
requirements-completed: [QUOTE-02, QUOTE-04, QUOTE-05]

# Execution notes
execution:
  commits:
    - "0ef8da8: feat(10-06): QuotationStatusActions.tsx (lifecycle + convert)"
    - "6e675e2: feat(10-06): quotation detail/edit page"
  checkpoint: "human-verify checkpoint APPROVED by owner 2026-07-07 after live testing on localhost:3000."

# Verification evidence (owner + orchestrator, 2026-07-07)
verification:
  - "npx tsc --noEmit clean; npx vitest run green (33 files)"
  - "Owner confirmed live: quotation saving works, PDFs render correctly (Draft Quotation / Quotation / converted Invoice), Mark Sent emails the client (received), Resend works, Convert to Invoice lands on the invoice page with all details carried over"
  - "Orchestrator verified live earlier: create → send (real email) → accept → convert (draft invoice #36, client + line items copied) → re-convert blocked 409"
  - "Note: a dev-server route-cache glitch (all dynamic [id] routes 404) surfaced mid-testing and was fixed by clearing .next + restarting netlify dev — not a code defect"
