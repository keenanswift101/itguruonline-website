---
name: frontend-engineering
description: 'Frontend engineering workflows for IT-Guru.Online. Use when: building React/Next.js components, implementing responsive layouts, creating form wizards, domain checker UI, light/dark theme toggle, animations, Tailwind CSS patterns, or accessibility compliance.'
---

# Frontend Engineering Skill

## When to Use
- Building page layouts and responsive components
- Implementing multi-step form wizard (registration)
- Creating domain availability checker UI
- Setting up light/dark theme system
- Performance optimization (Core Web Vitals)
- Accessibility compliance (WCAG AA)

## Component Architecture

```
components/
  ├── ui/                  # Atomic UI elements
  │   ├── Button.tsx
  │   ├── Input.tsx
  │   ├── Select.tsx
  │   ├── Card.tsx
  │   ├── Badge.tsx
  │   ├── Modal.tsx
  │   └── ThemeToggle.tsx
  ├── forms/               # Form composites
  │   ├── DomainChecker.tsx
  │   ├── RegistrationWizard.tsx
  │   ├── ContactForm.tsx
  │   └── QuoteCalculator.tsx
  ├── layout/              # Layout shells
  │   ├── Header.tsx
  │   ├── Footer.tsx
  │   ├── Sidebar.tsx
  │   └── PageContainer.tsx
  └── sections/            # Page sections
      ├── Hero.tsx
      ├── ServiceCards.tsx
      ├── Testimonials.tsx
      └── CTABanner.tsx
```

## Procedures

### Theme Toggle Implementation
1. Use CSS custom properties for all theme tokens
2. Store preference in `localStorage` with key `theme`
3. Check `prefers-color-scheme` as default
4. Apply `dark` class to `<html>` element
5. Transition: `transition: background-color 200ms, color 200ms`
6. Ensure all components use theme tokens, never hardcoded colors

### Multi-Step Form Wizard
1. Use React state machine or useReducer for form state
2. Validate each step before allowing next
3. Show progress bar with step labels
4. Allow back navigation without data loss
5. Save draft to localStorage on each step change
6. Final step: review all data before submission
7. Handle submission states: idle → loading → success / error

### Domain Checker UI
1. Search input with debounced API call (300ms)
2. Loading skeleton while checking
3. Green checkmark + "Available!" for available domains
4. Red X + "Taken" with alternative suggestions for unavailable
5. Click alternative to select it
6. "Register Now" button → navigates to registration with domain pre-filled

### Responsive Breakpoints
```css
/* Mobile first */
default    → 0-639px    (1 column)
sm:        → 640px+     (still mobile-ish)
md:        → 768px+     (tablet)
lg:        → 1024px+    (desktop)
xl:        → 1280px+    (wide desktop)
2xl:       → 1536px+    (ultra-wide)
```

## Performance Checklist
- [ ] Images: Next.js `<Image>` with proper sizing
- [ ] Fonts: `next/font` with display swap
- [ ] Bundle: Dynamic imports for heavy components
- [ ] LCP: Hero image/text loads within 2.5s
- [ ] CLS: Explicit dimensions on all media
- [ ] FID: No long-blocking JavaScript on main thread

## References
- [Project Brief](../../docs/PROJECT-BRIEF.md)
- [Registration Form Spec](../../docs/CLIENT-REGISTRATION-FORM.md)
