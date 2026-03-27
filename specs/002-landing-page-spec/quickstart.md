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
- Optional Playwright smoke: `npm run test:e2e` (to be added if visual coverage is introduced).

## 6. Lint / Format (optional but recommended)

```bash
cd frontend
npm run lint
npm run format   # if prettier configured
```

## 7. Prepare for Handoff

- Confirm `src/i18n/en.json` + `ar.json` include all keys documented in `contracts/landing-ui.md`.
- Capture Lighthouse report (desktop + mobile) to prove SC-001/SC-004.
- Document any deviations inside `specs/002-landing-page-spec/plan.md` under Complexity Tracking if new waivers are required (none expected for this phase).
