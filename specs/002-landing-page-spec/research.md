# Research — Phase 1 Landing Page

## Decision: Use a centralized i18next provider with persisted locale state

- **Rationale**: The landing page spans seven sections and multiple shared controls (navbar language switch, footer indicator). Wrapping the SPA in a single `I18nextProvider` backed by `react-i18next` keeps hooks consistent (`useTranslation()` everywhere) while a minimal `LanguageContext` can mirror the currently selected locale, set `document.dir`, and save to `localStorage`. This satisfies Principle II and the spec’s persistence requirement without duplicating state in each component.
- **Alternatives considered**: (a) Manually import JSON files per component and maintain custom context — rejected because it duplicates string-loading logic and complicates plurals/RTL toggling. (b) Use browser `navigator.language` only — rejected because the spec requires explicit user switching and persistence, not heuristic detection.

## Decision: Compose sections from data-driven config objects

- **Rationale**: Features + models sections contain structured content that is easy to describe as arrays (icon, title, description, provider). Defining these arrays in `src/data/landing.ts` (or similar) and mapping to presentational components keeps the JSX lean and allows translation keys like `features.multiModel.title`. It also simplifies future additions such as more models from new providers.
- **Alternatives considered**: (a) Hardcode card markup inline — rejected for maintainability and translation reuse. (b) Fetch marketing copy from backend — rejected per assumption A-003 (static marketing copy for this phase).

## Decision: Enforce RTL/LTR via document-level `dir` + Tailwind utilities

- **Rationale**: Setting `document.documentElement.dir` ensures HTML, body, and Tailwind’s logical utilities respect RTL automatically, while specific components (chips, model cards) can rely on Tailwind’s `rtl:` variants for fine-grained flips. This approach avoids duplicating layouts and ensures compliance with Constitution Principle II.
- **Alternatives considered**: (a) Duplicating separate React trees for Arabic vs English — rejected as brittle and hard to keep parity. (b) Injecting custom CSS overrides without `dir` — rejected because focus order and browser-native behavior (scrollbars, text selection) would remain LTR.

## Decision: Mock auth state via a lightweight hook for CTA routing

- **Rationale**: The hero CTA must route to `/chat` for logged-in users and `/login` otherwise, but authentication is not part of Phase 1. Exposing a simple `useAuthStatus()` hook (backed by context or even a feature flag) lets us stub the behavior now and later wire into the real auth provider without rewriting the hero logic.
- **Alternatives considered**: (a) Hardcode CTA to `/login` until auth ships — rejected because the spec explicitly requires session-aware routing and it would violate success criteria SC-003. (b) Import backend auth services on the landing page — rejected because Phase 1 scope is purely frontend and should not introduce unnecessary dependencies.

## Decision: Validate look-and-feel via automated visual smoke tests

- **Rationale**: Success criteria emphasize brand fidelity (dark neon palette, chips, glass). Adding a Jest + RTL snapshot test per section plus a lightweight Playwright smoke test (viewport 360px + 1440px) ensures regressions are caught. Visual tests double as documentation of the layout tokens enforced by Tailwind.
- **Alternatives considered**: (a) Manual review only — rejected because consistent neon/RTL styling is easy to regress. (b) Full Storybook pipeline — deferred to a later phase since the landing page has limited interactivity and Playwright provides enough coverage for now.
