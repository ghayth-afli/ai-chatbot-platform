# Quickstart — Phase 1 Landing Page

## 1. Prerequisites

- Node.js 18+ and npm 9+ (validated by `run.sh` preflight).
- Python backend setup from Phase 0 so `run.sh` still orchestrates both services (backend stays idle for this phase).
- `frontend/.env` not required; all landing data is static.

## 2. Install / Update Dependencies

```bash
cd frontend
npm install
```

Tailwind/i18next/React Router are already listed in `package.json`; `npm install` ensures lockfile matches the latest spec-compliant versions.

## 3. Start the Landing Page

```bash
# from repository root
./run.sh
```

- Backend will start first (needed for future phases), then the React dev server serves http://localhost:3000.
- Alternatively, to work frontend-only:

```bash
cd frontend
npm run dev
```

## 4. Verify Functional Requirements

1. Load `http://localhost:3000/` → confirm navbar → hero → features → models → bilingual → about → footer order.
2. Toggle the EN/AR switch in the navbar → ensure text updates immediately and layout flips to RTL for AR.
3. Click “Start Chatting” while unauthenticated → router moves to `/login`. Simulate `isAuthenticated=true` (temporarily toggled in mock hook) and re-test → CTA routes to `/chat`.
4. Use optional nav links (Features/About) → page scrolls smoothly to anchored sections.
5. Resize browser to 360px width or open mobile emulator → confirm cards stack, nav collapses, and footer remains legible.

## 5. Run Tests

```bash
cd frontend
npm test
```

- Jest + React Testing Library suite should cover component rendering, translation presence, CTA routing logic, and RTL toggling.
- Playwright E2E tests: `npm run test:e2e` (headless) or `npm run test:e2e:ui` (interactive).

---

## 6. QA Testing Guide & Responsive Behavior Documentation (T031)

### 6.1 Test Environments

**Viewports to Test:**

- **Mobile (360px)**: Pixel 5, iPhone SE (portrait)
- **Tablet (768px)**: iPad, Galaxy Tab
- **Desktop (1440px)**: Standard desktop, MacBook Pro 16"

**Browsers:**

- Chrome/Chromium (primary)
- Firefox (secondary)
- Safari/WebKit (tertiary)

### 6.2 Responsive Layout Behavior

**Hero Section:**

- **Mobile (360px)**:
  - Title stacks vertically on 2 lines max
  - Subtitle wraps naturally with 1rem side margin
  - Model chips arrange in single column (if present)
  - CTA button spans 80% width, centered
  - Expected height: ~600–700px

- **Desktop (1440px)**:
  - Title remains on single line with large font-size (text-5xl)
  - Subtitle positioned below with full width
  - Model chips may display in horizontal row (flex)
  - CTA button: standard width with hover effects
  - Expected height: ~500–600px

**Feature Cards:**

- **Mobile (360px)**:
  - Cards stack in single column
  - Each card: full-width with 1rem padding
  - Icon + text align vertically
  - Expected: 5 sections, ~100px each = 500px total

- **Desktop (1440px)**:
  - Cards display in 2–3 column grid
  - Each card: equal height, uniform spacing
  - Icon + text alignment: left-aligned with text wrap
  - Expected: Grid layout with 2–3 cards per row

**Models Section:**

- **Mobile (360px)**:
  - Table converts to card layout (one model per "card" row)
  - Provider name, model name, capabilities stack vertically
  - No horizontal scroll

- **Desktop (1440px)**:
  - Full table display with columns: Provider | Model | Capabilities | Status
  - Header row sticky (if scrollable)
  - Alternating row backgrounds for readability

**Bilingual Section:**

- **Mobile (360px)**:
  - English snippet: left-aligned, 90% width
  - Arabic snippet: right-aligned (RTL), 90% width, same styling
  - Chat bubble: spans full width below
  - Expected: ~400px total for both snippets + bubble

- **Desktop (1440px)**:
  - Snippets positioned side-by-side (50/50 split or flex)
  - Chat bubble: centered below, max-width 600px
  - Syntax highlighting visible (not cramped)

**About Section:**

- **Mobile (360px)**:
  - Paragraphs: 1rem padding, 90% width
  - Line-height: 1.6 for readability on small screens
  - Accent color highlights wrap naturally

- **Desktop (1440px)**:
  - Paragraphs: full-width container with max-width constraint (900px)
  - Multi-column layout possible (not required, but acceptable)
  - Font-size: 1rem (desktop) vs 0.95rem (mobile)

**Footer:**

- **Mobile (360px)**:
  - Logo + brand text stacks vertically
  - Links in single column, full-width buttons
  - Social icons (if any): row, centered, spaced evenly

- **Desktop (1440px)**:
  - Logo + brand text: horizontal layout
  - Links: horizontal row with 1rem spacing
  - Social icons: right-aligned

### 6.3 RTL (Arabic) Behavior

**Document Direction:**

- When AR selected, `document.documentElement.dir = "ar"` and `html` tag shows `dir="ar"`
- All Tailwind margin/padding utilities respect directionality:
  - `ml-4` (margin-left in LTR) → `mr-4` (margin-right in RTL)
  - `pr-8` (padding-right) → `pl-8` in RTL

**Navbar RTL:**

- Logo position: remains left in both LTR and RTL (brand identity)
- Navigation links: right-aligned in RTL, left-aligned in LTR
- Language toggle: position-mirrored
- Hamburger menu: position-mirrored

**Text Direction:**

- Arabic text automatically right-aligned
- English text within Arabic sections: inline, mixed directionality handled by browser
- Bilingual snippets: English (LTR) + Arabic (RTL) side-by-side

**Checkbox / Form Elements:**

- RTL: checkboxes appear on right side of labels
- Input fields: standard RTL mirroring via browser defaults

### 6.4 Accessibility Compliance

**Keyboard Navigation:**

- Tab order: logo → nav links → language toggle → hamburger (mobile)
- Focus outline: 2px solid `var(--color-volt)` (approx. #00E5FF)
- No focus traps unintended; mobile menu only traps when open

**Mobile Menu Focus-Trap:**

- When hamburger menu open: Tab/Shift+Tab confined within menu
- First menu item auto-focused on open
- ESC key closes menu, focus returns to hamburger button
- Click-outside closes menu

**Color Contrast (WCAG AA minimum 4.5:1):**

- Primary CTA (Signup): Volt (#00E5FF) on Ink (#0A0E27)
  - Calculated contrast: ~7.5:1 ✓
- Secondary CTA (Login): Volt border on Ink text
  - Calculated contrast: ~4.5:1 ✓
- Nav text (Paper/70%): Paper (#F5F1E8) at 70% opacity on Ink
  - Calculated contrast: ~5:1 ✓

**ARIA Labels:**

- Nav: `<nav aria-label="Main navigation">`
- Hamburger: `<button aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">`
- Links: descriptive text or `aria-label` for icon-only buttons
- Headings: proper h1–h6 hierarchy

### 6.5 Performance Metrics (Lighthouse)

**Target Scores:**

- **Accessibility**: ≥90
- **Best Practices**: ≥90
- **Performance**: ≥80 (target: <3s First Contentful Paint)
- **SEO**: ≥90

**Test with:**

```bash
npm run build
npx lighthouse http://localhost:3000 --view
```

### 6.6 E2E Test Execution (Playwright)

**Install Playwright:**

```bash
npm install -D @playwright/test
```

**Run all E2E tests:**

```bash
npm run test:e2e
```

**Run specific test file:**

```bash
npx playwright test tests/e2e/landing.spec.ts
```

**Run with UI (interactive):**

```bash
npm run test:e2e:ui
```

**Run with headed browser (visible):**

```bash
npm run test:e2e:headed
```

**Test Coverage (26 tests across 6 suites):**

1. **Mobile Layout (360px)**: 6 tests
   - Section visibility and stacking
   - Hamburger menu functionality
   - Focus-trap keyboard navigation
   - CTA button minimum size (44x44px)
   - Language toggle accessibility
   - No horizontal scroll

2. **Desktop Layout (1440px)**: 5 tests
   - Horizontal navigation display
   - Hamburger hidden on desktop
   - Feature grid layout
   - Models section table/grid
   - Full-width layout without overflow

3. **Navigation & Routing**: 4 tests
   - Home navigation to hero
   - Section link scrolling/routing
   - Signup route (/signup)
   - Login route (/login)

4. **Language Switching & RTL**: 3 tests
   - EN/AR toggle updates text
   - Arabic persistence after reload
   - RTL directionality applied

5. **Accessibility**: 5 tests
   - Keyboard navigation through page
   - CTA button color contrast
   - Focus indicators on interactive elements
   - Proper heading hierarchy (h1 present)
   - Nav ARIA labels

6. **Performance & Visual**: 3 tests
   - Page load time <3s
   - Image load errors
   - Hero gradient background rendering

### 6.7 Manual QA Checklist

Use this checklist when performing manual testing before release:

**Landing Page Functional:**

- [ ] All 7 sections render in correct order
- [ ] Scroll snap/smooth scroll works
- [ ] Hero gradient visible on load
- [ ] Feature icons load without errors
- [ ] Models data displays correctly
- [ ] Bilingual snippets show correct syntax highlighting
- [ ] Footer branding clear

**Language Switching:**

- [ ] EN/AR toggle in navbar works
- [ ] Text updates immediately (no page reload)
- [ ] Document direction (`dir="ar"`) changes
- [ ] Layout mirrors for RTL
- [ ] Language persists after page reload

**Navigation:**

- [ ] Navbar links scroll to sections smoothly
- [ ] Signup button routes to `/signup`
- [ ] Login button routes to `/login`
- [ ] Hero CTA routes based on auth state
- [ ] Back button returns to landing

**Mobile (360px):**

- [ ] Hamburger menu opens/closes
- [ ] Menu contains all nav links
- [ ] Focus trapped within menu when open
- [ ] ESC closes menu
- [ ] No horizontal scroll
- [ ] Touch targets ≥44x44px
- [ ] Text readable (16px minimum)

**Tablet (768px):**

- [ ] Cards display in 2-column grid
- [ ] Navbar shows horizontal links
- [ ] No menu button visible
- [ ] Spacing looks balanced

**Desktop (1440px):**

- [ ] Feature grid 3-column layout
- [ ] Models table fully visible
- [ ] No overflow or scroll
- [ ] CTA buttons properly spaced
- [ ] Footer layout horizontal

**Accessibility:**

- [ ] Tab through page: focus visible on all interactive elements
- [ ] Mobile menu: focus trap works, ESC closes
- [ ] Screen reader: headings announced correctly
- [ ] Contrast checker: all text ≥4.5:1 ratio
- [ ] Mobile: touch targets ≥44x44px

**Performance:**

- [ ] Page loads in <3 seconds
- [ ] No console errors/warnings
- [ ] Lighthouse scores ≥80 across board
- [ ] Images load without 404s

### 6.8 Known Limitations & Edge Cases

**Mobile Safari:**

- `vh` units may behave differently on viewport resizing
  - **Mitigation**: Use `max-h` constraints where needed
- Touch hover states not supported
  - **Mitigation**: Use `:active` pseudo-class for tap feedback

**Firefox Mobile:**

- Some CSS grid properties may need prefixes
  - **Mitigation**: Autoprefixer handles this during build

**RTL Mixed Content:**

- Inline code/quotes may not mirror direction
  - **Mitigation**: Explicitly set `ltr` class on code blocks if needed

**Very Small Screens (<320px):**

- Not officially supported (iPhone SE is 375px)
- Graceful degradation expected

### 6.9 Release Checklist

Before marking landing page as production-ready:

- [ ] All 26 Playwright E2E tests passing
- [ ] Jest unit + integration tests passing
- [ ] Lighthouse scores captured in SETUP_LOG.md
- [ ] Manual QA checklist completed on all devices/browsers
- [ ] No console errors or warnings in Dev Tools
- [ ] Accessibility audit (axe, Lighthouse) ≥90 score
- [ ] Screenshot documentation added to this file (if visual QA required)
- [ ] Performance baseline established (<3s FCP)
- [ ] Deployment approved by product/QA leads

## 7. Lint / Format (optional but recommended)

```bash
cd frontend
npm run lint
npm run format   # if prettier configured
```

## 8. Prepare for Handoff

- Confirm `src/i18n/en.json` + `ar.json` include all keys documented in `contracts/landing-ui.md`.
- Capture Lighthouse report (desktop + mobile) to prove SC-001/SC-004.
- Document any deviations inside `specs/002-landing-page-spec/plan.md` under Complexity Tracking if new waivers are required (none expected for this phase).
