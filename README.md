# nexus AI — Multi-Model Chatbot Platform

Phase 0 establishes the local development environment for the nexus AI platform. This repository contains a Django REST backend, a React frontend with a fully bilingual landing page, and a one-command orchestration script so contributors can get productive immediately.

## Quick Start

```bash
./run.sh
```

The script provisions dependencies, applies database migrations, and starts both servers. When it finishes you should see:

```
Backend running on http://127.0.0.1:8000
Frontend running on http://localhost:3000
```

### Landing Page Features

The **landing page** (Phase 1, live at `http://localhost:3000/`) showcases:

- **Bilingual UI**: English + Arabic with automatic RTL layout switching
- **Responsive Design**: Optimized for mobile (360px), tablet (768px), and desktop (1440px) viewports
- **Mobile-First Navigation**: Hamburger menu with keyboard focus-trap for accessibility
- **Interactive Demos**: Live bilingual code snippets, AI model cards, and feature highlights
- **Modern Styling**: Neon accents, glass morphism, and smooth animations
- **Accessibility**: WCAG 2.1 Level AA compliant with keyboard navigation and screen reader support

**Test the landing page:**

```bash
# View landing page
open http://localhost:3000

# Test language switching: Click EN/عربي toggle in navbar
# Test mobile: DevTools → toggle device condition to Pixel 5 (360px)
# Run E2E tests: cd frontend && npm run test:e2e
# Run accessibility audit: npx lighthouse http://localhost:3000 --view
```

## Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Python 3.10+
- Git
- Bash shell (macOS, Linux, or Windows via WSL2)

Verify your versions:

```bash
node --version
npm --version
python3 --version
git --version
```

## Manual Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Backend setup:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
3. Frontend setup:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Project Structure

```
project/
├── backend/        # Django REST API
├── frontend/       # React app (React Router + Tailwind + i18next)
│   ├── src/
│   │   ├── pages/       # Page components (Landing, etc.)
│   │   ├── components/  # Reusable UI components
│   │   │   └── landing/ # Landing page sections
│   │   ├── hooks/       # Custom hooks (useLanguage, useAuthStatus, etc.)
│   │   └── i18n/        # Translations (EN/AR)
│   └── tests/e2e/       # Playwright E2E tests
├── specs/          # Feature specs & planning artifacts
│   ├── 001-environment-setup/
│   └── 002-landing-page-spec/
├── run.sh          # One-command startup script
├── .env            # Local environment variables (git-ignored)
├── .env.example    # Environment template
└── README.md       # This file
```

## Technology Stack

| Layer    | Technology                                                      |
| -------- | --------------------------------------------------------------- |
| Backend  | Python 3.10+, Django 5, DRF, django-cors-headers, python-dotenv |
| Frontend | React 18, React Router, Axios, Tailwind CSS 3, i18next          |
| Testing  | pytest + pytest-django, Jest, React Testing Library, Playwright |
| Database | SQLite (development)                                            |
| i18n     | i18next + react-i18next (EN/AR, RTL support)                    |

## Frontend Development

### Available Scripts

```bash
cd frontend

npm start          # Start dev server (http://localhost:3000)
npm test           # Run Jest unit tests
npm run build      # Production build
npm run test:e2e   # Run Playwright E2E tests (headless)
npm run test:e2e:ui    # Run E2E tests with interactive UI
npm run test:e2e:headed # Run E2E tests in headed browser
```

### Testing Coverage

- **Unit Tests**: Component rendering, translation keys, auth logic → `npm test`
- **E2E Tests**: Layout responsiveness (360px/1440px), routing, language switching → `npm run test:e2e`
- **26 Playwright Scenarios**: Mobile/desktop layouts, accessibility, navigation, RTL behavior

### Lighthouse Scores (Target)

- **Performance**: ≥80 (FCP <3s)
- **Accessibility**: ≥90 (AA compliant)
- **Best Practices**: ≥90
- **SEO**: ≥90

Run Lighthouse:

```bash
npm run build
npx lighthouse http://localhost:3000 --view
```

## Contributing

1. Fork the repository and create a new branch from the latest phase.
2. Follow the instructions in `specs/{phase}/tasks.md` and `plan.md`.
3. Run `pytest` (backend) and `npm test` + `npm run test:e2e` (frontend) before submitting a PR.
4. Ensure `./run.sh` succeeds without manual intervention.
5. Reference the landing page QA guide in `specs/002-landing-page-spec/quickstart.md` for manual testing steps.

## Landing Page QA & Deployment

Before shipping the landing page to production:

- [ ] All 26 Playwright E2E tests passing
- [ ] Jest unit tests passing (`npm test`)
- [ ] Lighthouse scores ≥80 across all metrics
- [ ] Manual QA checklist completed (see `specs/002-landing-page-spec/quickstart.md`)
- [ ] Accessibility audit clean (no WCAG violations)
- [ ] Lighthouse metrics captured in `SETUP_LOG.md`

## License

This project is provided for development and evaluation. See `LICENSE` (to be added) for details.
