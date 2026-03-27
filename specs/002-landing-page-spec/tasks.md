# Tasks — Phase 1 — Landing Page

All tasks follow the checklist format mandated by /speckit.tasks. IDs are sequential, include `[P]` for parallel-safe work, and `[USx]` labels for user-story phases.

## Phase 1 – Setup (Environment readiness)

- [x] T001 Verify `run.sh` preflight passes and both dev servers boot by running `./run.sh` at repo root (run.sh).
- [x] T002 Install/refresh frontend dependencies with `npm install` to lock React/Tailwind versions (frontend/package.json).
- [x] T003 Capture brand references by bookmarking the design system for quick usage during implementation (brand_identity_chatbot_genz.html).

## Phase 2 – Foundational Infrastructure (shared prerequisites)

- [x] T004 Create shared content data source exporting feature/model/bilingual arrays (frontend/src/data/landingContent.js).
- [x] T005 Add complete English translation keys per contracts (nav/hero/features/models/bilingual/about/footer) (frontend/src/i18n/en.json).
- [x] T006 Add mirrored Arabic translation keys with RTL-friendly copy (frontend/src/i18n/ar.json).
- [x] T007 Expand i18next bootstrap to load new namespaces, fallbacks, and missing-key handler (frontend/src/i18n/i18n.js).
- [x] T008 Implement `LanguageProvider` + `useLanguage()` hook that syncs i18next, `document.dir`, and `localStorage` (frontend/src/hooks/useLanguage.js).
- [x] T009 Wrap the router with `LanguageProvider` and ensure root layout applies `dir` + font classes (frontend/src/App.jsx).

## Phase 3 – User Story 1: Experience the landing story (Priority P1)

- [x] T010 [US1] Lay out the landing page scaffold with anchored sections and scroll snapping (frontend/src/pages/Landing.jsx).
- [x] T011 [P] [US1] Build the hero component with gradient background, model chips, and translated headline/subhead (frontend/src/components/landing/Hero.jsx).
- [x] T012 [P] [US1] Render the five-feature grid using data-driven cards and neon accents (frontend/src/components/landing/Features.jsx).
- [x] T013 [P] [US1] Implement the models section cards/table referencing provider data (frontend/src/components/landing/Models.jsx).
- [x] T014 [P] [US1] Create the bilingual showcase block with English/Arabic snippets and chat bubble visuals (frontend/src/components/landing/Bilingual.jsx).
- [x] T015 [P] [US1] Implement the about section copy + layout with translation-driven paragraphs (frontend/src/components/landing/About.jsx).
- [x] T016 [US1] Build the footer with brand mark, AI platform label, language indicator, and optional GitHub link (frontend/src/components/landing/Footer.jsx).
- [x] T017 [US1] Add Jest + RTL smoke test ensuring all seven sections render in order (frontend/src/pages/**tests**/Landing.test.jsx).

## Phase 4 – User Story 2: Switch languages & directions (Priority P1)

- [x] T018 [US2] Add EN/AR toggle to the navbar hooked to `useLanguage()` with accessible button labels (frontend/src/components/landing/Navbar.jsx).
- [x] T019 [US2] Apply RTL-aware Tailwind utilities/variants for layout mirroring across sections (frontend/src/App.css).
- [x] T020 [US2] Ensure `LanguageProvider` hydrates from `localStorage`, updates `document.documentElement.dir`, and exposes current locale (frontend/src/hooks/useLanguage.js).
- [x] T021 [US2] Display bilingual samples with Arabic font classes + RTL alignment even when page is LTR (frontend/src/components/landing/Bilingual.jsx).
- [x] T022 [US2] Write unit tests covering language persistence and direction flipping (frontend/src/hooks/**tests**/useLanguage.test.js).

## Phase 5 – User Story 3: Navigate to product surfaces (Priority P1)

- [x] T023 [US3] Create a mock `useAuthStatus()` hook that exposes `isAuthenticated` + toggles for local testing (frontend/src/hooks/useAuthStatus.js).
- [x] T024 [US3] Wire the hero CTA to route to `/chat` or `/login` based on auth state while keeping labels translated (frontend/src/components/landing/Hero.jsx).
- [x] T025 [US3] [P] Implement navbar buttons with right-aligned positioning: **Signup** (PRIMARY, filled Volt, 7.8:1 contrast) and **Login** (SECONDARY, outline Volt, 4.5:1 contrast), both 44px+ height; add profile/history anchor links with smooth scroll fallback (frontend/src/components/landing/Navbar.jsx).
- [x] T026 [US3] Ensure React Router defines `/login`, `/signup`, `/chat`, `/profile`, `/history` routes or placeholder components (frontend/src/App.jsx).
- [x] T027 [US3] Cover CTA + navbar routing with RTL-aware integration tests (frontend/src/App.test.jsx).

## Phase 6 – User Story 4: Mobile-first responsive experience (Priority P2)

- [x] T028 [US4] Apply responsive Tailwind classes so every section stacks cleanly between 320px–768px (frontend/src/components/landing/\*.jsx).
- [x] T029 [US4] Add a collapsible/mobile navbar variant with hamburger toggle and focus-trap (frontend/src/components/landing/Navbar.jsx).
- [x] T030 [US4] Capture Playwright (or Cypress) smoke test at 360px + 1440px verifying layout + CTA behavior (frontend/tests/e2e/landing.spec.ts).
- [x] T031 [US4] Document responsive + RTL behaviors with screenshots for QA handoff (specs/002-landing-page-spec/quickstart.md).

## Phase 7 – Polish & Cross-Cutting Concerns

- [x] T032 Run axe or Lighthouse accessibility audit and fix contrast/focus regressions (frontend/package.json scripts + frontend/src/components/landing/\*).
- [x] T033 Update project README with landing page preview + instructions for language toggle (README.md).
- [x] T034 Capture final Lighthouse metrics + Jest/Playwright results in `SETUP_LOG.md` for traceability (SETUP_LOG.md).

---

## Dependencies / Story Order

1. Phase 1 → 2: Environment + shared infrastructure must finish before user-facing stories.
2. [US1] depends on foundational translations and provider wiring.
3. [US2] builds on [US1] UI to add bilingual switching.
4. [US3] depends on [US1] sections + [US2] provider to wire CTA/nav behavior.
5. [US4] depends on prior stories because responsiveness touches all sections.
6. Polish tasks run last after functional stories are complete.

## Parallel Execution Examples

- **US1**: T011–T015 component builds can proceed in parallel once Landing scaffold (T010) exists.
- **US2**: T018 and T019 can run alongside T020 after provider skeleton is ready.
- **US3**: T024 and T025 can progress concurrently once the auth hook (T023) is stubbed.
- **US4**: T028 and T029 can be split between layout and navigation specialists while T030 prepares e2e scripts.

## Implementation Strategy (MVP → polish)

1. **MVP Slice**: Deliver US1 + US2 to ship a fully bilingual landing page with all sections rendered and RTL toggle working.
2. **Conversion Slice**: Layer US3 routing + CTA logic to move visitors into auth/chat flows.
3. **Quality Slice**: Complete US4 responsiveness, then run polish tasks (accessibility + docs + metrics) before handoff.
