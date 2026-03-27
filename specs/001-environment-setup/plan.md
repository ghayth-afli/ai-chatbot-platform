# Implementation Plan: Phase 0 — Environment Setup

**Branch**: `001-environment-setup` | **Date**: 2026-03-27 | **Spec**: [specs/001-environment-setup/spec.md](spec.md)
**Input**: Phase 0 Environment Setup Specification for nexus AI multi-model chatbot platform

---

## Summary

Phase 0 establishes the complete development environment for the nexus AI multi-model chatbot platform. This is the critical blocking prerequisite for all subsequent development. The phase sets up:

- **Backend**: Django + DRF modular structure with 5 apps (users, chats, ai, summaries, api)
- **Frontend**: React with modern tooling, routing, i18n (EN/AR), Tailwind CSS
- **Orchestration**: Single `run.sh` command that starts both services with smart database migration detection
- **Security**: Environment variable management via .env with python-dotenv (zero hardcoded secrets)
- **Database**: SQLite development database with automated schema initialization via Django migrations

**Technical Approach**:

- Automated setup via run.sh that handles Python venv activation, dependency installation, and database initialization
- Minimal console logging (status messages only) for clean developer experience
- Idempotent migration handling enables developers to run `./run.sh` repeatedly without issues
- Modular Django app structure from the start aligns with Constitution Principle I
- i18n configuration (English + Arabic) from day 1 aligns with Constitution Principle II
- Tailwind CSS foundation ready for brand implementation aligns with Constitution Principle III

## Technical Context

**Language/Version (Frontend)**: JavaScript/TypeScript via Node.js >= 18 LTS (latest stable at dev time)  
**Language/Version (Backend)**: Python >= 3.10 (latest stable at dev time)  
**Primary Dependencies**:

- Frontend: React (latest), React Router, Axios, Tailwind CSS, i18next
- Backend: Django (latest), Django REST Framework, djangorestframework-simplejwt, django-cors-headers, python-dotenv, requests  
  **Storage**: SQLite (development database at `backend/db.sqlite3`)  
  **Testing**:
- Backend: pytest with Django TestCase plugin
- Frontend: Jest + React Testing Library  
  **Target Platform**: macOS, Linux, Windows with WSL2 (per Assumption A-002)  
  **Project Type**: Full-stack web application (React frontend + Django REST backend)  
  **Performance Goals**:
- Backend startup: < 30 seconds (SC-001)
- Frontend startup: < 20 seconds (SC-002)
- Full-stack via run.sh: < 60 seconds (SC-003)  
  **Constraints**:
- Development environment only (not production)
- Single-command startup required
- Bash shell (WSL2 for Windows users)
- No hardcoded API keys or secrets  
  **Scale/Scope**:
- Initial developer team: 1-2 developers
- No external services during setup
- Modular structure to support future scaling

## Constitution Check

**GATE STATUS**: ✅ PASS — Phase 0 aligns with all 5 constitutional principles

### Principle I: Multi-Model AI Architecture

**Requirement**: Clean, modular backend with separate Django apps  
**Phase 0 Implementation**: ✅ Backend initialized with 5 modular apps (users, chats, ai, summaries, api) enabling clean separation of concerns. Django app structure is architecturally ready for AI model routing in later phases.

### Principle II: Bilingual & Internationalized by Default

**Requirement**: English + Arabic support, JSON i18n files, RTL layout  
**Phase 0 Implementation**: ✅ Frontend i18n configured with i18next; translation files created at i18n/en.json and i18n/ar.json. React Router setup enables language switching. RTL support framework ready for Phase 1 component implementation.

### Principle III: Brand-Driven Modern UX (nexus Identity)

**Requirement**: Tailwind CSS, neon colors, glass surfaces, modern typography  
**Phase 0 Implementation**: ✅ Tailwind CSS configured in frontend build; design tokens from brand_identity_chatbot_genz.html available for Phase 1 component styling. PostCSS configured for processing.

### Principle IV: Modern Tech Stack & Latest Versions

**Requirement**: Latest stable React, Django, Node.js; no deprecated patterns  
**Phase 0 Implementation**: ✅ All dependencies use latest stable versions: React (latest), Django (latest), Node.js LTS, npm 9+. Virtual environment & modern tooling (Vite-ready toolchain) established.

### Principle V: Security & Privacy by Core Design

**Requirement**: JWT auth, .env secrets, no hardcoding, input validation  
**Phase 0 Implementation**: ✅ .env configuration with python-dotenv established; API keys never hardcoded. .gitignore excludes .env from version control. djangorestframework-simplejwt installed for Phase 1 JWT implementation.

**Overall Assessment**: Phase 0 establishes a constitutionally compliant foundation. All infrastructure decisions enable seamless Phase 1 feature development.

## Project Structure

### Documentation (this feature)

```text
specs/001-environment-setup/
├── spec.md              # Feature specification (DONE)
├── plan.md              # This file (DONE)
├── research.md          # Phase 0 research (GENERATED)
├── data-model.md        # Phase 1 data model (GENERATED)
├── quickstart.md        # Phase 1 quickstart (GENERATED)
├── contracts/           # Phase 1 API contracts (GENERATED)
├── checklists/          # Quality checklists
└── tasks.md             # Task breakdown (/speckit.tasks command)
```

### Source Code (repository root)

**Selected Structure**: Option 2 — Web Application with Backend + Frontend

```text
project/
├── backend/
│   ├── manage.py                    # Django project management
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Environment template
│   ├── config/                      # Django settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/                        # Modular Django apps
│   │   ├── users/                   # User management
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── chats/                   # Chat sessions & messages
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── ai/                      # AI model routing
│   │   │   ├── models.py
│   │   │   ├── services.py          # AI API integration
│   │   │   └── urls.py
│   │   ├── summaries/               # User profile summaries
│   │   │   ├── models.py
│   │   │   └── services.py
│   │   └── api/                     # API configuration
│   │       └── urls.py
│   └── tests/                       # Backend tests
│       ├── unit/
│       ├── integration/
│       └── contract/
│
├── frontend/
│   ├── package.json                 # Node dependencies
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js            # PostCSS config
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── App.jsx                  # Root component
│   │   ├── components/              # Reusable components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   └── ...
│   │   ├── features/                # Feature-based structure
│   │   │   ├── auth/                # Authentication feature
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   └── authService.js
│   │   │   ├── chat/                # Chat feature
│   │   │   │   ├── ChatPage.jsx
│   │   │   │   ├── ChatHistory.jsx
│   │   │   │   └── chatService.js
│   │   │   ├── profile/             # User profile
│   │   │   └── history/             # Chat history
│   │   ├── services/                # API services
│   │   │   ├── api.js               # Axios instance
│   │   │   └── authService.js
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   └── useChat.js
│   │   ├── i18n/                    # Internationalization
│   │   │   ├── en.json              # English translations
│   │   │   ├── ar.json              # Arabic translations
│   │   │   └── config.js            # i18next configuration
│   │   ├── pages/                   # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── layouts/                 # Layout components
│   │   │   ├── MainLayout.jsx
│   │   │   └── AuthLayout.jsx
│   │   └── App.css                  # Tailwind imports
│   └── tests/                       # Frontend tests
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── specs/                           # Feature specifications (this directory)
│
├── .env                             # Environment variables (git-ignored)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore patterns
├── run.sh                           # Unified startup script
├── README.md                        # Project documentation
└── package.json                     # Root package.json (optional for monorepo)
```

**Structure Decision**: Option 2 (Web Application) selected because:

- Phase 0 sets up both frontend (React) and backend (Django) in parallel
- Separate directories enable independent startup and testing
- Modular Django app structure (users, chats, ai, summaries, api) follows Constitution Principle I
- Feature-based React structure (auth/, chat/, profile/, history/) aligns with modular architecture
- Clear separation enables Phase 1 parallel development of multiple features

## Complexity Tracking

**Assessment**: ✅ NO VIOLATIONS — Phase 0 has no constitutional conflicts requiring justification.

All design decisions directly enable constitutional principle compliance:

- Modular Django structure → Principle I ✅
- i18n setup (EN/AR) → Principle II ✅
- Tailwind CSS foundation → Principle III ✅
- Latest stable versions → Principle IV ✅
- .env secrets management → Principle V ✅

No trade-offs required. Proceed to implementation.

---

## Planning Artifacts Generated

### Phase 0 Complete

- ✅ **plan.md** (this file) — Technical decisions, architecture, project structure
- ✅ **research.md** — Validation of all clarifications; no ambiguities remain
- ✅ **data-model.md** — Database schema, Django models, migration strategy
- ✅ **quickstart.md** — Developer guide, setup instructions, troubleshooting
- ✅ **contracts/api.md** — Health check endpoint, API standards, response formats

### Deliverables Summary

| Artifact         | Status      | Purpose                                                         |
| ---------------- | ----------- | --------------------------------------------------------------- |
| spec.md          | ✅ Complete | 4 user stories, 15 functional requirements, 10 success criteria |
| plan.md          | ✅ Complete | Technical context, constitution check, project structure        |
| research.md      | ✅ Complete | Clarification resolution, technology validation                 |
| data-model.md    | ✅ Complete | Database schema, Django models, fixtures                        |
| quickstart.md    | ✅ Complete | Setup guide, troubleshooting, development workflow              |
| contracts/api.md | ✅ Complete | API endpoints, response formats, CORS policy                    |
| tasks.md         | ⏳ Next     | Generated by `/speckit.tasks` command                           |

---

## Ready for Task Generation

All planning phases complete:

- ✅ Phase 0 Research: DONE (no ambiguities)
- ✅ Phase 1 Design: DONE (data model, API contracts, developer guide)

**Next Step**: Run `/speckit.tasks` to generate actionable, dependency-ordered task breakdown

---

**Plan Status**: ✅ COMPLETE | **Date**: 2026-03-27 | **Ready for Tasks**
