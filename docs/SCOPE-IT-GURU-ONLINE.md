# Project Scope — IT-Guru Online Website

> **Swift Designz** — Don't settle for less, Strive for the best.

---

## Project Overview

| Field | Details |
|---|---|
| **Project Name** | IT-Guru Online — Business Website |
| **Client** | IT-Guru Online (Ambrose Isaacs) |
| **Client Location** | Kuils River, South Africa |
| **Developer** | Swift Designz (Solo — Design + Build) |
| **Status** | In Progress / Beta |
| **Live Preview** | https://it-guru-online.netlify.app/ |
| **Deployment** | Netlify (with `@netlify/plugin-nextjs`) |

---

## The Problem

IT-Guru Online is an IT services and web hosting company that was relying entirely on **manual processes** to onboard new clients:

- Clients had to physically fill in or email paper-based registration forms
- Domain availability checks were handled by staff manually
- No automated quotation system existed
- The old website (`it-guru.co.za`) was outdated, unsecured, and offered no interactive functionality

This created friction in the client onboarding experience, wasted staff time, and presented a poor first impression for a tech-forward business.

---

## The Solution

A fully automated, modern business website built to replace every manual touchpoint in the client acquisition and onboarding pipeline:

- Clients can **check domain availability in real-time** and proceed directly to registration
- A **multi-step digital registration wizard** captures all required applicant, domain, and service information
- Built-in **client-side and server-side validation** ensures data quality before submission
- **Netlify Forms** handles secure form data collection without a dedicated backend database
- An automated reference number is generated per submission using cryptographically secure IDs
- The entire UI is delivered with **WCAG 2.1 AA accessibility compliance** and full **light/dark mode** support

---

## Technical Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4 (CSS-first config) |
| **Email Notifications** | Resend |
| **Forms** | Netlify Forms (with honeypot spam protection) |
| **Deployment** | Netlify + `@netlify/plugin-nextjs@5` |
| **Version Control** | Git / GitHub |

---

## Key Features

### 1. Live Domain Availability Checker
- Real-time WHOIS-style lookup across `.co.za`, `.com`, `.net`, `.org`, `.online`
- Instant available/taken feedback with alternative suggestions
- Direct CTA to proceed to registration with the checked domain pre-filled

### 2. Multi-Step Client Registration Wizard
A guided 4-step onboarding form replacing the legacy paper-based client intake process:
- **Step 1** — Personal Applicant Information (name, ID, address, contact details)
- **Step 2** — Domain Details (auto-populated from the domain checker)
- **Step 3** — Service Selection (hosting packages, additional services)
- **Step 4** — Declaration & Digital Consent (terms acceptance, read-only date, signature)
- LocalStorage draft auto-save with **24-hour expiry** (protects client PII)
- Form validation on every step before progression

### 3. Contact Form
- Client-side validation before submission (name, email, subject, message)
- Spam protection via hidden honeypot field
- Netlify Forms integration for zero-backend form handling

### 4. Light / Dark Theme Toggle
- System preference detection on first visit (`prefers-color-scheme`)
- Anti-FOUC (Flash of Unstyled Content) prevention via synchronous inline script in `<head>`
- Cross-tab theme synchronisation via `localStorage` storage event listener
- CSS custom property token system (`--bg-primary`, `--text-primary`, etc.)

---

## Technical Highlights

These represent deliberate engineering decisions made to production-quality standards:

### Security
- **HTTP Security Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` via `next.config.ts`
- **HSTS** — `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` via `netlify.toml`
- **Input Sanitization** — Server-side stripping of `<script>`, `javascript:`, `vbscript:`, `data:` URIs, and null bytes on all API routes
- **Cryptographic IDs** — Reference numbers generated using `crypto.randomUUID()` (eliminates predictable `Math.random()` IDs)
- **Production Log Hygiene** — All `console.log` statements gated behind `NODE_ENV !== "production"`

### Accessibility (WCAG 2.1 AA)
- `prefers-reduced-motion` media query disables all CSS animations globally
- `AnimatedCounter` programmatically skips RAF animation loop for reduced-motion users; supplies a `sr-only` static value for screen readers
- Decorative carousels (`TechCarousel`, `ProcessCarousel`) marked `aria-hidden="true"` to prevent screen readers from reading 30+ duplicate items
- Touch targets for icon buttons at 44×44px minimum (WCAG 2.5.8)
- `aria-live="polite"` on domain checker results for real-time announcement
- `role="radiogroup"` + `role="radio"` + `aria-checked` on service selection package grid
- `aria-invalid`, `aria-describedby`, `role="alert"` on form field errors
- All landmark sections (`header`, `footer`, `main`, named sections) are labelled

### Performance
- Anti-FOUC inline script prevents theme flash on page load — zero layout shift on theme detection
- Static generation for all marketing pages; only API routes are server-rendered
- CSS custom properties with Tailwind v4's CSS-first config — no extra runtime JS for theming

---

## My Role

**Solo Developer — Design + Build**

Responsible for the full product lifecycle on this project:
- Translated client requirements and old static site content into a modern interactive application
- Designed the UI/UX system (colour tokens, typography scale, component library, dark/light mode)
- Architected the multi-step form wizard with draft persistence, validation, and step gating
- Built and secured all API routes (`/api/register`, `/api/contact`, `/api/domain/check`)
- Performed and resolved a comprehensive audit covering security, accessibility, performance, and UI/UX

---

## Business Impact

| Before | After |
|---|---|
| Manual paper-based client registration | Fully digital, self-service onboarding wizard |
| Staff manually checking domain availability | Real-time automated domain lookup |
| No input validation or spam protection | Multi-layer validation (client + server + honeypot) |
| Unsecured HTTP headers, predictable IDs | Hardened headers, HSTS, crypto-secure reference IDs |
| Old static HTML site, no accessibility | WCAG 2.1 AA compliant, responsive, mobile-first |
| Single `.co.za` domain check | 5 TLD extension availability checked simultaneously |

---

## Partnership Context

This project was delivered as part of a business partnership between **Swift Designz** and **IT-Guru Online**:

- **Swift Designz** — Builds and develops the website
- **IT-Guru Online** — Provides hosting, domain registration, IT support, and infrastructure

This model allows both companies to co-market services and refer clients mutually.

---

## Project Assets

| Asset | Location |
|---|---|
| Project Brief | `docs/PROJECT-BRIEF.md` |
| Client Registration Form Reference | `docs/CLIENT-REGISTRATION-FORM.md` |
| Original Site Content | `docs/scraped-content/` |
| Live Preview | https://it-guru-online.netlify.app/ |
| Repository | Private — available on request |
