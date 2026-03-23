---
name: fullstack-dev
description: 'Full-stack development workflows for IT-Guru.Online. Use when: building API routes, database schemas, authentication, domain availability checking, form submission handling, deployment pipelines, or any backend+frontend integration task.'
---

# Full-Stack Development Skill

## When to Use
- Building API endpoints (domain checker, form submission, quotation engine)
- Setting up database schemas and migrations
- Implementing authentication and authorization
- Configuring deployment and CI/CD
- Integrating frontend with backend services

## Architecture Overview

```
Frontend (Next.js/React)
  ├── Pages (SSR/SSG)
  ├── Components (Client)
  └── API Routes (/api/*)
        ├── /api/domain/check    — WHOIS lookup
        ├── /api/domain/suggest   — Alternative TLDs
        ├── /api/register         — Client registration
        ├── /api/quote            — Quotation generator
        ├── /api/contact          — Contact form handler
        └── /api/blog             — Blog CRUD
Backend
  ├── Database (Supabase/PostgreSQL)
  ├── Auth (Supabase Auth)
  ├── Storage (Supabase Storage)
  └── Email (Resend/SendGrid)
```

## Procedures

### Domain Availability Check API
1. Accept domain name from client
2. Validate domain format server-side
3. Query WHOIS API or registrar API (e.g., Namecheap, GoDaddy reseller)
4. If unavailable, generate alternatives across TLDs: .co.za, .com, .net, .org, .online, .africa
5. Return availability status + alternatives as JSON
6. Rate-limit endpoint to prevent abuse

### Registration Form Backend
1. Validate all fields server-side (see `docs/CLIENT-REGISTRATION-FORM.md`)
2. Sanitize inputs against XSS/injection
3. Store in database with unique application ID
4. Send confirmation email to applicant
5. Send notification to admin (info@it-guru.co.za)
6. Return success response with application reference

### Environment Variables Required
```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
DOMAIN_API_KEY=           # WHOIS/registrar API
DOMAIN_API_URL=
EMAIL_API_KEY=            # Resend/SendGrid
ADMIN_EMAIL=info@it-guru.co.za
NEXT_PUBLIC_SITE_URL=https://it-guru.online
```

## References
- [Project Brief](../../docs/PROJECT-BRIEF.md)
- [Registration Form Spec](../../docs/CLIENT-REGISTRATION-FORM.md)
- [Scraped Content](../../docs/scraped-content/)
