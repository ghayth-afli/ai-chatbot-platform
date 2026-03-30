# ai-chatbot-platform Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-30

## Active Technologies
- Python 3.11 (Django 5.0.2) backend; JavaScript/React 18.2.0 frontend (003-user-auth)
- SQLite (dev), PostgreSQL (production) for User model and VerificationCode model (003-user-auth)
- Python 3.11 (Django), JavaScript/TypeScript (React 18+) (004-chat-system)
- SQLite (Phase 4) / PostgreSQL (production); three new models (ChatSession, Message, UserSummary) (004-chat-system)
- Python 3.11 (backend), JavaScript/React (frontend) + Django REST Framework, React, i18next (i18n), Axios, Tailwind CSS (005-multilang-summaries)
- SQLite (existing) - extend User model with language_preference; Chat/Session models tagged with language_tag; new UserSummary model with archive_status (005-multilang-summaries)

- React 18 (JavaScript/JSX) on Node.js 18 LTS + npm 9; Tailwind CSS 3.x for styling. + React Router v6.21, i18next + react-i18next, Tailwind CSS/PostCSS pipeline, Axios (already present though unused this phase), React Testing Library + Jest for UI tests. (002-landing-page-spec)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

React 18 (JavaScript/JSX) on Node.js 18 LTS + npm 9; Tailwind CSS 3.x for styling.: Follow standard conventions

## Recent Changes
- 005-multilang-summaries: Added Python 3.11 (backend), JavaScript/React (frontend) + Django REST Framework, React, i18next (i18n), Axios, Tailwind CSS
- 004-chat-system: Added Python 3.11 (Django), JavaScript/TypeScript (React 18+)
- 003-user-auth: Added Python 3.11 (Django 5.0.2) backend; JavaScript/React 18.2.0 frontend


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
