---
name: ui-ux-design
description: 'UI/UX design system and patterns for IT-Guru.Online. Use when: designing interfaces, creating color palettes, typography scales, spacing systems, user flow diagrams, wireframes, accessibility audits, responsive design strategy, component design, or light/dark theme architecture.'
---

# UI/UX Design Skill

## When to Use
- Designing new pages or components
- Setting up or extending the design system
- Creating user flow diagrams
- Conducting accessibility audits
- Optimizing conversion flows (domain checker → registration)
- Implementing responsive design patterns

## Design Tokens

### Colors
```css
:root {
  /* Primary */
  --color-primary-50: #f0fdfa;
  --color-primary-100: #ccfbf1;
  --color-primary-500: #14b8a6;
  --color-primary-600: #0d9488;
  --color-primary-700: #0f766e;
  --color-primary-800: #115e59;

  /* Secondary (Blue) */
  --color-secondary-500: #3b82f6;
  --color-secondary-700: #1d4ed8;
  --color-secondary-800: #1e40af;

  /* Accent (Amber) */
  --color-accent-400: #fbbf24;
  --color-accent-500: #f59e0b;
  --color-accent-600: #d97706;

  /* Neutral */
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1e293b;
  --color-gray-900: #0f172a;

  /* Semantic */
  --color-success: #16a34a;
  --color-error: #dc2626;
  --color-warning: #d97706;
  --color-info: #2563eb;
}

[data-theme="dark"] {
  --bg-primary: var(--color-gray-900);
  --bg-secondary: var(--color-gray-800);
  --bg-surface: var(--color-gray-700);
  --text-primary: var(--color-gray-50);
  --text-secondary: var(--color-gray-300);
  --border-color: var(--color-gray-600);
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: var(--color-gray-50);
  --bg-surface: var(--color-gray-100);
  --text-primary: var(--color-gray-900);
  --text-secondary: var(--color-gray-600);
  --border-color: var(--color-gray-200);
}
```

### Typography Scale
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

### Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

## Component Patterns

### Button Variants
```
Primary:   bg-primary-700, white text, hover:bg-primary-800
Secondary: border-primary-700, primary text, hover:bg-primary-50
Ghost:     transparent, primary text, hover:bg-gray-100
Danger:    bg-red-600, white text, hover:bg-red-700
Sizes:     sm (h-8, text-sm), md (h-10, text-base), lg (h-12, text-lg)
```

### Card Pattern
```
bg-surface, rounded-xl, border, p-6
Hover: shadow-lg, translateY(-2px)
Transition: 200ms ease
```

### Form Input Pattern
```
h-10, rounded-lg, border, px-3
Focus: ring-2 ring-primary-500, border-primary-500
Error: ring-2 ring-red-500, border-red-500, error text below
Disabled: opacity-50, cursor-not-allowed
```

## Procedures

### Design New Component
1. Define purpose and usage context
2. Identify states: default, hover, focus, active, disabled, error, loading
3. Set responsive behavior at each breakpoint
4. Choose color tokens from design system (never hardcode)
5. Ensure accessible contrast ratios
6. Document as Tailwind className patterns

### Accessibility Audit
1. Run Lighthouse accessibility scan
2. Check color contrast (WCAG AA = 4.5:1 text, 3:1 large text)
3. Verify keyboard navigation order
4. Test screen reader announcements
5. Check touch target sizes (min 44x44px)
6. Verify focus indicators are visible
7. Test with `prefers-reduced-motion`

## References
- [Project Brief](../../docs/PROJECT-BRIEF.md)
