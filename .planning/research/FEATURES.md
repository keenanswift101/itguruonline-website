# Feature Research

**Domain:** Single-operator SMB CRM + invoicing + automation (IT services admin portal, South Africa)
**Researched:** 2026-06-30
**Confidence:** MEDIUM-HIGH (table stakes/anti-features verified against multiple lightweight CRM/invoicing products and SARS official guidance; some automation cadence specifics are MEDIUM/LOW — best-practice ranges, not hard standards)

## Feature Landscape

This research focuses on the four new capability areas for v2.0: **CRM** (enquiry/client tracking), **Pricing Management** (live-editable hosting/domain pricing + settings), **Invoicing** (generate/track, no payment gateway), and **Automation** (reminder emails, recurring invoice generation). Existing site features (registration wizard, contact form, domain checker, Resend email) are treated as upstream dependencies, not re-researched.

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auto-capture every registration/contact submission as a CRM record | This is the entire value prop — "every enquiry captured" fails immediately if any submission path doesn't land in the portal | LOW | Registration wizard (`RegistrationWizard`) and `ContactForm` already POST to API routes/Resend; intercept at the same point to write a DB record before/alongside sending email. Single integration point per form. |
| Single status field per record (New → Contacted → In Progress → Completed) | Universal lightweight CRM pattern; owner needs an at-a-glance "what needs action" view | LOW | Verified pattern: small-business CRM best practice caps lead status at 5-7 values max, action-oriented labels not funnel-abstraction labels. PROJECT.md's 4 statuses (new/contacted/in progress/completed) fit this. |
| Search/filter enquiry & client list | With even 20-30 active records, a flat unsorted list becomes unusable within weeks | LOW | Filter by status + text search (name/email/domain) covers single-operator scale; no need for saved views or complex query builder. |
| Free-text notes per record, timestamped | Owner's only memory aid for "what did I last tell this client" — table stakes for any CRM, however minimal | LOW | Append-only note list (not single editable field) preserves history; no rich text needed, plain textarea is sufficient. |
| Sequential, unique invoice numbering | **Legal requirement**, not a preference — SARS requires tax invoices to carry a unique, sequential, traceable number with no gaps or reused numbers | LOW | DB auto-increment or owner-controlled counter; must never allow manual duplicate/skip that breaks audit trail. |
| Tax-invoice-compliant fields (supplier name/address/VAT no. if registered, customer name, invoice date, description, amount, VAT shown separately or stated inclusive) | SARS abridged tax invoice rules apply even to small transactions (R50–R5,000); full tax invoice required above R5,000 with recipient details | LOW-MEDIUM | Confirm with owner whether IT-Guru is VAT-registered — if not, invoices are NOT "tax invoices" and must avoid that label (using it when not VAT-registered is itself a compliance error covered as an anti-feature below). |
| Invoice status lifecycle (Draft → Sent → Paid → Overdue) | This is the explicit v2.0 requirement and matches every lightweight invoicing tool (Wave, Invoice Ninja, Zoho) at this scale | LOW | "Overdue" should be a derived/computed state (due date passed + not marked paid), not a status the owner manually sets — avoids stale data. |
| PDF or print-friendly invoice generation | Clients expect a document they can attach to an EFT payment / keep for records, not just a web page | LOW-MEDIUM | Many lightweight tools (Wave, Zoho Invoice) treat this as baseline; a server-rendered HTML invoice that prints cleanly is sufficient — full PDF library optional. |
| Manual "mark as paid" action | No payment gateway means the *only* way invoice status changes from Sent → Paid is owner action after reconciling the EFT in their bank | LOW | Must be a deliberate one-click action; do not require external reconciliation tooling for v2.0. |
| CSV/spreadsheet export of enquiries/clients/invoices | Explicit v2.0 requirement; also the owner's de facto "backup" and accountant handoff mechanism in a no-accounting-software setup | LOW | Plain CSV is sufficient — no need for XLSX formatting, multiple sheets, or scheduled exports. |
| Editable pricing reflected live on public site with no deploy | This is the headline differentiator over the current hard-coded-in-two-files setup — table stakes *for this specific milestone*, not for CRMs generally | MEDIUM | Requires the public `/services` page and registration wizard's package picker to read from the same data source the admin edits (currently `HOSTING_PACKAGES` in `registration-types.ts` + `packages` array in `services/page.tsx` — single biggest architectural change in this milestone). |
| Secure single-admin login | Non-negotiable — this is a private portal exposing client PII or it's worthless | LOW-MEDIUM | Single user, no roles/permissions matrix needed for v2.0 (explicitly out of scope per PROJECT.md). Session-based auth is sufficient; avoid building a multi-tenant-ready auth system prematurely. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Domain checker → CRM linkage (capture searched-but-not-registered domains as soft leads) | Turns an existing tool (real-time TLD checker) into a lead-capture surface instead of a dead-end utility — most competitors' domain checkers are throwaway tools | MEDIUM | Not in PROJECT.md's Active scope explicitly, but flagged as a natural extension since the domain checker already exists. Recommend deferring unless owner asks — avoid scope creep into the checker's existing, recently-stabilized behavior (see git history: two recent fixes to that exact code path). |
| Per-TLD live domain pricing replacing "request a quote" | Direct revenue-path improvement: visitors currently hit a dead end on pricing for anything beyond hosting, which is a known conversion gap (flagged in PROJECT.md Context as a "known gap since project status reporting") | LOW-MEDIUM | Mirrors hosting package editing pattern; same underlying live-pricing infrastructure, second application of it. |
| Automated recurring invoice generation for hosting renewals on each client's billing cycle | Directly removes the single most repetitive manual task at this business's scale (every active hosting client, every month/year) — the single highest-leverage automation in scope | MEDIUM-HIGH | Requires: (1) billing cycle field on client record, (2) scheduled job (Netlify scheduled functions or equivalent), (3) idempotency to avoid double-invoicing on retry/redeploy. This is the most technically involved feature in the milestone. |
| Automated stale-enquiry reminder email (to owner, "you haven't followed up on X") | Closes the actual pain point named in PROJECT.md ("no more losing leads in an inbox") — this is the feature that makes the CRM self-policing instead of relying on the owner remembering to check it | LOW-MEDIUM | Industry pattern ranges widely (24hrs to 90 days depending on sales cycle); for a B2B IT-services enquiry, a 3-7 day "no contact" threshold is reasonable — confirm with owner rather than assuming. Reminder goes to the *owner* (internal), not the lead — this is not lead-nurture automation, it's an internal nudge. |
| Automated overdue-invoice reminder email | Matches universal billing-reminder best practice (pre-due reminder + post-due escalation) and is explicitly scoped | LOW-MEDIUM | Standard cadence: a reminder before due date and one or more after. Recommend keeping v2.0 simple — one reminder at due date, one at N days overdue — rather than building a full dunning sequence. |
| Site settings management (contact email, hosting setup-fee note) without code changes | Removes a second category of "needs a developer" friction beyond pricing | LOW | Small, well-bounded — a settings table with a handful of keys, no general-purpose CMS needed. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Full sales pipeline / deal-stage Kanban board with custom stages | "CRM" branding makes owners assume they need HubSpot/Pipedrive-style pipeline visualization | Massive overkill for a single operator with a handful of enquiries/month; adds UI complexity (drag-drop, stage configuration) with no corresponding value at this scale — best-practice guidance explicitly caps simple CRMs at 5-7 fixed statuses, not configurable pipelines | Fixed 4-status field (New/Contacted/In Progress/Completed) as already scoped in PROJECT.md — resist any urge to make statuses owner-configurable in v2.0 |
| Auto status transitions (e.g., auto-flag enquiry as "stale" status, not just send a reminder) | Seems like a natural automation extension once reminder emails exist | Already explicitly called out as Out of Scope in PROJECT.md — auto-changing status removes the owner's manual judgment about what "stale" means for a given lead and risks silently mis-categorizing active conversations | Reminder email only; owner manually updates status after acting on it |
| Online payment collection / payment gateway integration (PayFast, Yoco, Paystack) | Natural-seeming "complete the loop" once invoices exist | Explicitly out of scope — introduces PCI-adjacent compliance burden, reconciliation complexity, and gateway fees that aren't justified at current invoicing volume per PROJECT.md's own reasoning | Manual "mark as paid" after owner reconciles EFT in their bank — keep payment collection entirely outside the system for v2.0 |
| Calling the invoice template a "Tax Invoice" / VAT invoice unconditionally | Most invoicing software defaults to tax-invoice language since most reference markets assume VAT registration | If IT-Guru is not VAT-registered, presenting documents as "Tax Invoice" with VAT fields is a compliance misstep (SARS reserves that designation and field set for registered vendors) — this is a real, verified legal distinction, not a style choice | Confirm VAT-registration status with the owner before building the invoice template; default to a plain "Invoice" (no VAT line) unless/until VAT registration is confirmed, with VAT fields as a togglable addition |
| Multi-staff roles / permissions matrix | Reasonable anticipation of "the business might grow" | Explicitly out of scope for v2.0 in PROJECT.md; building a roles/permissions system now for a single user adds auth complexity (role checks, permission tables) with zero current payoff | Single-admin auth; design the user table with room to add a `role` column later, but don't build the UI/logic for it now |
| Client-facing login/self-service portal (clients view their own invoices/status) | Feels like the "complete" version of a CRM+invoicing system | Explicitly out of scope; doubles the auth surface (two user types), requires its own UX, and isn't validated as needed — clients currently interact fine via email/EFT | Owner-only portal; invoices delivered via email (PDF/link), not a client login |
| Full double-entry accounting / bookkeeping (expense tracking, P&L, balance sheet) | "Invoicing" and "accounting" are conflated in many SMB tools (Sage, QuickBooks, Wave) which bundle both | Out of scope per PROJECT.md's framing (invoicing only, "generate/track" not full accounting) — building ledger/expense/reporting features is a different product with a much larger surface area | CSV export of invoices is sufficient for handoff to the owner's actual bookkeeping process (accountant or simple spreadsheet) |
| Real-time/live-updating dashboard (websockets, polling) for a single admin user | "Modern dashboard" expectation from SaaS-product habituation | Single user, low data-change frequency (a few enquiries/invoices per day at most) — real-time infrastructure (websockets, subscriptions) is pure complexity with no perceivable benefit for one person refreshing a page | Standard server-rendered/fetch-on-load admin pages; refresh-on-action is indistinguishable from real-time at this usage pattern |
| Configurable/custom invoice templates (multiple themes, drag-drop builder) | Visual customization feels valuable | One business, one brand — there's exactly one correct invoice design (matching the existing email template branding in `src/lib/email.ts`) | Single fixed invoice template matching the site's existing branded email layout conventions |

## Feature Dependencies

```
Secure single-admin login
    └──requires──> Auth/session infrastructure (new — greenfield per PROJECT.md)

Enquiry/client CRM records
    └──requires──> Auto-capture from Registration Wizard + Contact Form submission
                       └──requires──> DB write added to existing API routes (src/app/api/...)

Status tracking + Notes
    └──requires──> Enquiry/client CRM records (above)

Invoice generation
    └──requires──> Client record exists (CRM)
    └──requires──> Sequential invoice numbering (DB-level constraint/counter)

Invoice status tracking (Draft/Sent/Paid/Overdue)
    └──requires──> Invoice generation

Overdue-invoice reminder automation
    └──requires──> Invoice status tracking
    └──requires──> Scheduled job infrastructure (Netlify scheduled functions or equivalent)

Stale-enquiry reminder automation
    └──requires──> Status tracking
    └──requires──> Scheduled job infrastructure

Recurring invoice generation (hosting renewals)
    └──requires──> Invoice generation
    └──requires──> Client record with billing-cycle field
    └──requires──> Scheduled job infrastructure
    └──requires──> Live hosting pricing (so renewal invoices reflect current, not stale, prices)

Live-editable hosting pricing
    └──requires──> Single source of truth for pricing data (replaces dual hard-coded files)
                       └──enhances──> Registration Wizard package picker (reads same source)
                       └──enhances──> /services public pricing page (reads same source)

Live-editable domain pricing
    └──enhances──> Domain Checker (currently availability-only, no price)
    └──conflicts with──> none directly, but shares the "live pricing" infra with hosting pricing — should reuse the same mechanism, not a separate one

Site settings management
    └──requires──> Single source of truth pattern (same infra class as pricing)

CSV export (enquiries/clients/invoices)
    └──requires──> CRM records + Invoice records to exist first (nothing to export otherwise)
```

### Dependency Notes

- **Auto-capture requires touching existing API routes:** The registration wizard and contact form already exist and POST data that currently goes only to Resend for email. Adding CRM capture means modifying those existing, already-hardened (post-security-audit) endpoints — this should be done carefully and re-tested against `SECURITY-AUDIT.md` guidance rather than treated as purely additive.
- **All three automation features share one piece of infrastructure:** stale-enquiry reminders, overdue-invoice reminders, and recurring invoice generation all need a scheduled/cron-like job runner. This should be built once, generically, and reused three times — not three separate scheduling mechanisms. On Netlify this likely means Netlify Scheduled Functions (or an external cron-triggered webhook hitting an API route) — worth confirming current Netlify capability during architecture research, not assumed here.
- **Live pricing is the single biggest architectural lift in "table stakes":** both hosting pricing and domain pricing editing depend on first establishing one authoritative pricing data source (almost certainly a database table) that both the admin UI and the public-facing pages read from. This replaces the current hand-synced two-file setup and should be designed once, then applied to both hosting and domain pricing rather than building two parallel pricing systems.
- **Recurring invoice generation depends on live pricing being correct:** if a hosting client's renewal invoice is auto-generated, it must pull the *current* price for their package/tier from the same live pricing source — not a snapshotted price baked in at signup (unless deliberately versioned, e.g. "price the client originally agreed to" vs "current list price" — this is a product decision worth flagging to the owner, not assumed).
- **Recurring billing conflicts with no-payment-gateway scope only superficially:** auto-generating an invoice is fine without a gateway; auto-*collecting* payment is what's out of scope. Keep the line clear during implementation — "auto-generate and email" yes, "auto-charge" no.

## MVP Definition

### Launch With (v1 — this milestone, per PROJECT.md Active requirements)

- [ ] Secure single-admin login — nothing else functions without this gate
- [ ] Auto-capture of every registration/contact submission into CRM records — the core "never lose a lead" value prop
- [ ] View/search/filter enquiries & clients — capture without visibility is worthless
- [ ] Status field (New/Contacted/In Progress/Completed) — minimum viable workflow tracking
- [ ] Notes per record — owner's working memory
- [ ] Live-editable hosting pricing (single source of truth, reflected on public site + wizard) — directly replaces the existing manual two-file sync pain point
- [ ] Live-editable domain pricing (replaces "request a quote") — closes a named revenue gap
- [ ] Site settings management (contact email, setup-fee note) — small, low-risk, same infra as pricing
- [ ] Invoice generation (line items, amount, due date) with compliant sequential numbering
- [ ] Invoice status tracking (Draft/Sent/Paid/Overdue, Overdue computed not manual)
- [ ] CSV export (enquiries/clients/invoices)
- [ ] Stale-enquiry reminder email (to owner)
- [ ] Overdue-invoice reminder email
- [ ] Recurring invoice auto-generation for active hosting clients

All of the above are already scoped as Active requirements in PROJECT.md — there is no meaningful "trim further" beyond what the owner has already decided, since this is a small, well-bounded set for a single-operator tool.

### Add After Validation (v1.x)

- [ ] Domain-checker-to-CRM lead capture (searched-but-unregistered domains become soft leads) — only once the core CRM loop is proven useful
- [ ] Multi-stage reminder cadence for overdue invoices (e.g., pre-due + due + N-days-overdue, rather than one reminder) — only if a single reminder proves insufficient in practice
- [ ] Invoice line-item templates/presets (e.g., one-click "add hosting renewal line") — quality-of-life once the owner has generated enough invoices manually to know which presets are worth it

### Future Consideration (v2+)

- [ ] Multi-staff logins / role-based access — explicitly deferred per PROJECT.md until team grows
- [ ] Client-facing self-service portal — explicitly deferred until client volume justifies it
- [ ] Online payment gateway integration — explicitly deferred until invoicing volume justifies compliance overhead
- [ ] Configurable/custom CRM pipeline stages — only if a fixed 4-status model is later proven insufficient (unlikely at this scale per ecosystem research)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Secure single-admin login | HIGH | MEDIUM | P1 |
| Auto-capture enquiries/clients into CRM | HIGH | LOW | P1 |
| View/search/filter CRM records | HIGH | LOW | P1 |
| Status tracking | HIGH | LOW | P1 |
| Notes per record | MEDIUM | LOW | P1 |
| Live-editable hosting pricing | HIGH | MEDIUM | P1 |
| Live-editable domain pricing | HIGH | LOW-MEDIUM | P1 |
| Site settings management | MEDIUM | LOW | P1 |
| Invoice generation + compliant numbering | HIGH | LOW-MEDIUM | P1 |
| Invoice status tracking | HIGH | LOW | P1 |
| CSV export | MEDIUM | LOW | P1 |
| Stale-enquiry reminder email | HIGH | LOW-MEDIUM | P1 |
| Overdue-invoice reminder email | HIGH | LOW-MEDIUM | P1 |
| Recurring invoice auto-generation | HIGH | MEDIUM-HIGH | P1 |
| Domain-checker-to-CRM lead capture | MEDIUM | MEDIUM | P2 |
| Multi-stage dunning cadence | LOW-MEDIUM | LOW-MEDIUM | P3 |
| Invoice line-item presets | LOW-MEDIUM | LOW | P3 |
| Multi-staff roles | LOW (now) | HIGH | P3 (future milestone) |
| Client self-service portal | LOW (now) | HIGH | P3 (future milestone) |
| Payment gateway integration | LOW (now) | HIGH | P3 (future milestone) |

**Priority key:**
- P1: Must have for launch (= PROJECT.md Active scope, all validated as appropriately scoped by this research)
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Wave (free invoicing) | Invoice Ninja (free/self-host tier) | Our Approach |
|---------|------------------------|--------------------------------------|--------------|
| Lead/client status tracking | Minimal — Wave is invoicing/accounting-first, not CRM-first | Basic client list, no formal pipeline | Fixed 4-status field tied directly to enquiry-to-client lifecycle — simpler than either, purpose-built for this business's flow |
| Invoice numbering & compliance | Sequential, customizable format | Sequential, customizable format | Sequential, SARS-compliant fields, single fixed format (no need for customization at single-business scale) |
| Recurring invoices | Yes (subscription-style) | Yes, a core feature | Yes — but scoped specifically to hosting renewal billing cycles tied to CRM client records, not a generic recurring-invoice feature for arbitrary line items |
| Payment collection | Built-in (Stripe etc.) | Built-in (40+ gateways) | Deliberately omitted — manual EFT + manual "mark as paid" only, per explicit business decision |
| Reminders | Payment reminders only | Payment reminders + some workflow automation | Both invoice (overdue) AND CRM (stale enquiry) reminders — broader than typical invoicing-only tools because this is CRM+invoicing combined from day one |
| Pricing/catalog management | Product/service catalog exists but isn't public-site-facing | Product catalog, not public-facing | Live-editable pricing that directly drives the *public marketing site*, not just internal invoice line items — this is the one area where our scope exceeds typical invoicing tools, because pricing here doubles as public content |

## Sources

- [CRM Lead Status: 2026 Setup & Automation Guide](https://prospeo.io/s/crm-lead-status)
- [CRM Pipeline Stages for Small Business Lead Follow Up](https://leadsorbit.ai/blogs/crm-pipeline-stages-for-small-business-lead-follow-up)
- [Automated Follow-Up in CRM: Best Practices for Small Business](https://www.nimble.com/blog/best-practices-of-automate-follow-ups-in-crm-for-small-business/)
- [CRM Workflow Automation: How Small Businesses Can Reduce Manual Follow-Ups](https://www.companionlink.com/blog/2026/06/crm-workflow-automation-how-small-businesses-can-reduce-manual-follow-ups/)
- [South Africa VAT Invoice Requirements: The Complete SARS Guide](https://invoicedataextraction.com/blog/south-africa-vat-invoice-requirements)
- [Invoice Numbering in South Africa: Formats and Rules — Rebill Blog](https://rebill.co.za/blog/invoice-numbering-south-africa/)
- [What is a valid tax invoice: essential 2026 guide — Ready Accounting](https://www.readyaccounting.co.za/what-is-a-valid-tax-invoice-south-africa-guide/)
- [SARS Tax Invoice Checklist (official PDF)](https://www.sars.gov.za/wp-content/uploads/Docs/Government/Tax-Invoice-Checklist-Version-2-29032016.pdf)
- [Free Invoice Software South Africa: 2026 Comparison — PopPay](https://poppay.money/blog/free-invoice-software-south-africa/)
- [12 Best Free Invoicing Software for African SMEs (2025)](https://crm.africa/free-invoicing-software/)
- [How to Set Up SaaS Billing & Recurring Invoicing in 8 Steps](https://payproglobal.com/how-to/set-up-saas-billing-and-recurring-invoicing/)
- [Recurring Invoice: Complete Guide to Automated Billing in 2026](https://www.artsyltech.com/blog/Recurring-Invoice)
- [Invoice Ninja vs Bonsai (March 2026) — TemperStack](https://www.temperstack.com/versus/invoice-ninja-vs-bonsai/)
- [13 Best Invoicing Software for Freelancers (2026) — Agiled](https://agiled.app/blog/best-invoicing-software-for-freelancers)
- Internal: `.planning/PROJECT.md` (requirements, constraints, decisions, context as of 2026-06-23)

---
*Feature research for: Single-admin CRM + invoicing + automation portal (SA SMB IT services)*
*Researched: 2026-06-30*
