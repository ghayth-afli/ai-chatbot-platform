# Implementation Plan: Phase 1 — Landing Page

**Branch**: `002-landing-page-spec` | **Date**: 2026-03-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-landing-page-spec/spec.md`

## Summary

Design and implement the nexus.ai landing page as a React + Tailwind single page that showcases the multi-model, bilingual chatbot experience. The work centers on seven branded sections (navbar, hero, features, models, bilingual showcase, about, footer), dynamic EN/AR switching with RTL support, and React Router wiring so visitors can jump directly into login, signup, chat, profile, or history flows. Visual language must mirror the brand_identity_chatbot_genz.html file, emphasize dark neon UI, and keep all textual content in JSON translation files to satisfy Principle II.

## Technical Context

**Language/Version**: React 18 (JavaScript/JSX) on Node.js 18 LTS + npm 9; Tailwind CSS 3.x for styling.  
**Primary Dependencies**: React Router v6.21, i18next + react-i18next, Tailwind CSS/PostCSS pipeline, Axios (already present though unused this phase), React Testing Library + Jest for UI tests.  
**Storage**: Local JSON resources (src/i18n/en.json, src/i18n/ar.json) persisted via bundler; runtime preference stored in browser localStorage.  
**Testing**: Jest + React Testing Library snapshots/DOM assertions, plus potential Storybook visual review (if added later).  
**Target Platform**: Responsive web SPA served via Vite/CRA dev server, targeting modern evergreen browsers with desktop + mobile breakpoints and full RTL rendering.  
**Project Type**: Frontend marketing/landing page inside a larger React SPA.  
**Performance Goals**: First meaningful paint under 2s on broadband (per SC-001) and language toggles under 500ms.  
**Constraints**: Must follow nexus dark neon brand, maintain WCAG AA contrast, avoid hardcoded strings, preserve RTL parity, and keep bundle lean (static assets + JSON only).  
**Scale/Scope**: Single landing page with ~7 sections, ~15 translation keys per locale, single language toggle state shared globally.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Principle I (Multi-Model Architecture)**: PASS — models section + CTA describe multi-model value, backend untouched.
- **Principle II (Bilingual by Default)**: PASS — EN/AR JSON files, RTL mode, persisted preference are first-class requirements.
- **Principle III (Brand-Driven Modern UX)**: PASS — spec locks to dark neon palette, gradients, glass panels, and responsive layouts from brand identity doc.
- **Principle IV (Modern Stack + Latest Versions)**: PASS — React 18, Tailwind 3, React Router 6; no legacy libraries introduced.
- **Principle V (Security & Privacy)**: PASS — no secrets involved; routing honors auth context and language data stored locally only.

**Post-Design Recheck**: Research, data model, contracts, and quickstart outputs keep all five principles satisfied—no waivers or exceptions were introduced during planning.

## Project Structure

### Documentation (this feature)

```text
specs/002-landing-page-spec/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── landing-ui.md
└── tasks.md  # created later via /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── config/
├── users/
├── chats/
├── ai/
├── summaries/
├── api/
└── tests/

frontend/
├── package.json
├── tailwind.config.js
└── src/
    ├── App.jsx / App.css / App.test.jsx
    ├── components/
    ├── features/
    ├── pages/
    ├── layouts/
    ├── hooks/
    ├── services/
    └── i18n/

tests/
├── integration/
└── security/

run.sh / run.bat / README.md
```

**Structure Decision**: The landing page lives entirely inside `frontend/src`, leveraging existing directories (components, pages, layouts, i18n). Backend assets remain untouched but listed for completeness because run.sh orchestrates both services. Feature docs sit under `specs/002-landing-page-spec` alongside plan/research/data-model outputs.

## Complexity Tracking

No constitution waivers required; table intentionally left empty.
