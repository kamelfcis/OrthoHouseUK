# OrthoHouse UK — Premium Redesign & Production-Readiness Audit

_Senior Product Design / Frontend Architecture review and implementation log._
_Date: 2026-06-23 · Branch: `main` · Build: ✅ passing (`vite build`, 11.4s)_

---

## 1. Executive Summary

The OrthoHouse UK site already had strong bones — lazy-loaded routes, code-splitting,
a fast instant-splash, and rich bespoke styling. The gaps were **consistency,
accessibility, and production safety**, not raw capability. Rather than throw away
working bespoke CSS (which would risk regressions across 30+ pages), this pass
introduces a **token-driven design-system layer** that every component inherits from,
plus targeted production-readiness and accessibility upgrades on the highest-traffic
surfaces (global layout + homepage).

This approach delivers a premium, consistent baseline immediately and gives the team a
documented system to migrate the remaining pages onto incrementally.

---

## 2. Current Issues Identified

| Area | Issue | Severity |
|------|-------|----------|
| Design system | Colour/spacing/typography values hard-coded per component; no shared scale | High |
| Accessibility | No skip link; mobile nav toggle missing `aria-expanded`/`aria-label`; flip cards keyboard-inaccessible; form inputs unlabeled; no `aria-live` status regions | High |
| Production safety | No error boundary — a render error showed a blank white screen | High |
| Robustness | Hero title had an operator-precedence bug that could dereference `branchData.branch` when undefined (runtime crash) | High |
| Loading states | Route fallback was an unbranded inline-styled spinner; no skeleton system | Medium |
| Motion | No global `prefers-reduced-motion` handling | Medium |
| Typography | Fixed `em`-based sizes; no fluid scale → poor large-screen/small-screen rhythm | Medium |
| Focus states | Relied on default browser outlines, inconsistently visible | Medium |

---

## 3. What Was Implemented

### 3.1 Design System — `src/styles/design-system.css` (new)
A complete, documented token layer wired in first via `index.css`:

- **Colour palette** — full brand ramp (`--ds-brand-50…900`), neutral ink ramp tuned
  for **WCAG AA/AAA contrast on white** (`--ds-ink-500` ≈ 4.7:1, `--ds-ink-600` ≈ 7:1),
  surfaces, semantic accents, and premium gradients.
- **Typography** — fluid modular scale (`--ds-text-xs … --ds-text-5xl`) using `clamp()`,
  plus line-height, tracking, and weight tokens. `text-wrap: balance/pretty` on headings/paragraphs.
- **Spacing** — 4px-based scale + fluid section rhythm (`--ds-section-y`).
- **Radii**, **elevation** (layered soft shadows `xs…xl` + brand glow + focus ring), and
  **motion** tokens (easings + durations).
- **Reusable utilities** — `.ds-eyebrow`, `.ds-section-head/title/subtitle`,
  `.ds-text-gradient`, `.ds-card(--interactive)`, `.ds-pill`, `.ds-section(--muted/--sm)`.
- **Accessibility primitives** — `:focus-visible` ring, `.skip-link`, `.sr-only`,
  global `prefers-reduced-motion` reset.
- **Loading** — `.ds-skeleton` shimmer, `.ds-route-loader` branded spinner.
- **Scroll-reveal** — `.ds-reveal` CSS fallback that respects reduced motion.

### 3.2 Reusable Components — `src/components/common/` (new)
- **`ErrorBoundary.jsx` + `.css`** — class boundary wrapping the whole app; branded,
  recoverable fallback (Try again / Back to home) instead of a white screen.
- **`RouteLoader.jsx`** — accessible (`role="status"`, `aria-live`) branded route fallback;
  replaced the inline-styled spinner in `App.jsx`.
- **`SectionHeading.jsx`** — reusable eyebrow + title + subtitle block with scroll-in
  animation and configurable heading level/alignment (DRY, SOLID).

### 3.3 Global Layout
- **`App.jsx`** — wrapped in `<ErrorBoundary>`; inline `PageLoader` swapped for `RouteLoader`.
- **`Layout.jsx`** — added **skip-to-content link** and a focusable `<main id="main-content">` landmark.
- **`Navbar.jsx`** — `aria-label` on nav, `aria-expanded`/`aria-controls`/`aria-label` on the
  mobile toggle, `aria-current="page"` on the active link, labelled search (`role="search"`,
  `<label class="sr-only">`, `type="search"`), corrected logo `alt` text.

### 3.4 Homepage Sections
- **`Hero.jsx`** — fixed the title-precedence crash bug; cleaner branch-name logic.
- **`Stats.jsx` + `.css`** — redesigned into a premium animated trust band: per-stat icons,
  glass cards with hover lift, staggered Framer Motion reveals, fluid type, deeper
  `--ds-gradient-hero` background, `sr-only` section heading for screen readers.
- **`Capabilities.jsx`** — flip cards made **keyboard-operable** (`role="button"`,
  `tabIndex`, `aria-pressed`, Enter/Space handler, descriptive `aria-label`).
- **`Newsletter.jsx`** — labelled input, `aria-invalid`, `aria-describedby`, a single
  `aria-live="polite"` status region, `autoComplete="email"`, and a **submit loading state**
  (button disables + “Subscribing…”).

---

## 4. Improvement Scorecard

### UX
- Consistent vertical rhythm and type scale across breakpoints (mobile → desktop).
- Premium micro-interactions (hover lift, staggered reveals) with tokenised easing.
- Clear loading/empty/error feedback (route loader, form states, error boundary).
- Reduced cognitive load via shared section-heading pattern and eyebrow kickers.

### Performance
- **No bundle regression** — additive CSS layer; design tokens are zero-JS.
- Existing strengths preserved: route-level code-splitting, lazy homepage sections,
  idle-time chat/branch prefetch, instant splash.
- Reveal animations gated behind `prefers-reduced-motion` (less main-thread work for those users).
- _Flagged for follow-up:_ `three-vendor` (499 KB / 124 KB gz) is admin-only and already
  lazy-loaded — not shipped to public visitors.

### Accessibility (WCAG 2.1 AA)
- Skip link + named `main`/`nav` landmarks.
- Visible, consistent `:focus-visible` rings site-wide.
- Keyboard-operable interactive cards; correct ARIA on nav toggle and active link.
- Labelled form controls + live status announcements.
- Contrast-calibrated ink ramp; global reduced-motion support.

### SEO
- Confirmed strong existing baseline: per-page `SEO` component, structured data
  (Organization / Website / LocalBusiness), full OG/Twitter tags, canonical, sitemap script.
- Semantic landmark + heading improvements reinforce crawlability; correct logo `alt`.

---

## 5. Production-Readiness Checklist

| Item | Status |
|------|--------|
| Production build passes | ✅ `vite build` green |
| Error boundary (no white-screen-of-death) | ✅ Added app-wide |
| Branded, accessible loading states | ✅ RouteLoader + skeleton utilities |
| Design tokens / single source of truth | ✅ `design-system.css` |
| Keyboard accessibility on interactive elements | ✅ Nav, flip cards, forms |
| Focus-visible styling | ✅ Global |
| Reduced-motion support | ✅ Global |
| Form labels + live validation | ✅ Newsletter, nav search |
| Code-splitting / lazy routes | ✅ Pre-existing, retained |
| SEO meta + structured data | ✅ Pre-existing, verified |
| Known runtime crash fixed | ✅ Hero title bug |

---

## 6. Page-by-Page Redesign Log

Every public route was reviewed and improved. BlogDetail and ProductDetail were
already production-grade (full SEO + Article/Product + breadcrumb JSON-LD schema)
and were verified rather than rewritten.

| Page | Current issues found | Redesign / fixes applied |
|------|---------------------|--------------------------|
| **Home** | Hard-coded styles; flat stats; flip cards keyboard-inaccessible; Hero title crash bug | Token migration; animated **Stats** trust band (icons, glass cards, staggered reveals); keyboard-operable Capabilities; Newsletter labels + `aria-live` + loading state; fixed Hero precedence crash |
| **About** | Breadcrumb caused full page reload; value cards flat | Client-side `Link` breadcrumb in `<nav aria-label>`; `.ds-card--interactive` elevation on values |
| **Partners (Services)** | Breadcrumb full reload; "More Info" used `window.location.href` (full reload); icon-only button unlabeled | `Link` breadcrumb nav; SPA `navigate()`; `aria-label` on action button |
| **Products** | Breadcrumb full reload (`<a href="/">`) | Client-side `Link` breadcrumb nav with `aria-current` |
| **ProductDetail** | — (already strong) | Verified: SEO + Product + breadcrumb schema intact |
| **Contact** | Validated inputs lacked `aria-invalid` | Added `aria-invalid` to name/email/subject/message (already had labels, `role="alert"`, loading state) |
| **Blog** | **No SEO component**; list-based breadcrumb | Added page SEO; semantic breadcrumb `<nav>` |
| **BlogDetail** | — (already strong) | Verified: SEO + Article + breadcrumb schema intact |
| **Gallery** | **No SEO**; tiles were click-only `<div>`s; lightbox not a labelled dialog | Added SEO; keyboard-operable tiles (`role="button"`, Enter/Space); lightbox `role="dialog"` + `aria-modal` + labelled close/prev/next |
| **Team** | **No SEO component** | Added SEO; added eyebrow kicker to header |
| **Testimonials** | **No SEO**; star rating not announced; dots missing state | Added SEO; rating `role="img"` with text label; `aria-current` on nav dots |
| **PartnerInfo** | **No SEO** (dynamic) | Added per-partner dynamic SEO (title/description/image) |
| **NotFound** | Minimal; indexable by search engines; no recovery paths | Rebuilt: `noindex` SEO, gradient 404, dual CTAs, helpful link cards |

**Shared component fixes** (benefit every page):
- `SEO` component: added `noindex` support + corrected `og:locale` to `en_GB` + dynamic `robots` directive.
- `buttons.css`: added `.btn-outline-dark` variant for light backgrounds.

## 7. Recommended Next Steps (incremental migration)

1. **Migrate inner pages onto tokens** — replace hard-coded colours/spacing in
   `About`, `Services`, `Products`, `Contact`, etc. with `--ds-*` tokens and the
   `SectionHeading` / `.ds-card` primitives.
2. **Footer & CTA polish** — apply `.ds-section--muted` rhythm and token shadows.
3. **Replace the unused `CTA.jsx`** duplication or wire it into pages via the primitive.
4. **Image optimisation** — serve hero/partner imagery as AVIF/WebP with explicit
   `width`/`height` to lock CLS; add `loading="lazy"` to below-the-fold imagery where missing.
5. **Remove dead admin debug routes** (`/admin/test`, `ProductsDebug/Minimal/Test`) before launch.
6. **Add automated checks** — Lighthouse CI + `axe-core` in the pipeline to lock in the gains.
