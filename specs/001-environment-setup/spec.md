# Feature Specification: Phase 0 — Environment Setup

**Feature Branch**: `001-environment-setup`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: Phase 0 Environment Setup Specification for nexus AI multi-model chatbot platform

---

## Clarifications

### Session 2026-03-27

- Q: Should database migrations happen automatically in run.sh or manually beforehand? → A: Automated — run.sh detects pending migrations and applies them before starting servers (idempotent, smart detection)
- Q: Should run.sh script support Windows natively or require WSL2 only? → A: Bash-only per Assumption A-002 (Windows developers use WSL2)
- Q: What should console output show when run.sh starts both services? → A: Minimal — only "Backend running on http://127.0.0.1:8000" and "Frontend running on http://localhost:3000" status messages, suppress service logs
- Q: How should run.sh verify Node, npm, and Python versions to satisfy SC-009? → A: Add a preflight step that checks Node ≥ 18, npm ≥ 9, and Python ≥ 3.10, printing the required versions and exiting before setup continues if any check fails

---

## User Scenarios & Testing

### User Story 1 - Backend Development Environment Setup (Priority: P1)

A developer sets up the complete Django backend environment with all required dependencies, virtual environment, Django apps, and database migrations configured and ready to run.

**Why this priority**: Without a functional backend, the entire platform cannot operate. The backend is the core API layer and AI routing engine. This is the critical blocking prerequisite for all subsequent development.

**Independent Test**: Can be fully tested by: (1) Activating virtual environment, (2) Installing dependencies, (3) Running migrations, (4) Starting the Django server, (5) Confirming server responds on http://127.0.0.1:8000. Delivers: a fully functional Django REST API ready to accept frontend requests.

**Acceptance Scenarios**:

1. **Given** Python 3.10+ is installed, **When** developer runs backend setup commands, **Then** a Python virtual environment is created with all dependencies installed
2. **Given** virtual environment is active, **When** migrations are run, **Then** SQLite database is initialized with required schema
3. **Given** database is initialized, **When** Django development server starts, **Then** server listens on http://127.0.0.1:8000 and responds to health checks
4. **Given** Django apps (users, chats, ai, summaries, api) are created, **When** migrations are inspected, **Then** all apps are registered and migrations are applied
5. **Given** backend is running, **When** environment variables are loaded from .env, **Then** API keys and secrets are available without hardcoding

---

### User Story 2 - Frontend Development Environment Setup (Priority: P1)

A developer sets up the complete React frontend environment with all required dependencies, routing, internationalization (i18n), Tailwind CSS, and project structure initialized and ready to run.

**Why this priority**: Frontend is essential for the user interface. Must be set up in parallel with backend. This is the second critical blocking prerequisite. Developers must be able to run both frontend and backend together.

**Independent Test**: Can be fully tested by: (1) Creating React project, (2) Installing dependencies, (3) Configuring Router, i18n, Tailwind, (4) Starting dev server, (5) Confirming UI loads on http://localhost:3000. Delivers: a fully functional React development environment capable of rendering components.

**Acceptance Scenarios**:

1. **Given** Node.js 18+ and npm 9+ are installed, **When** React project is initialized, **Then** Node modules are installed and build system is configured
2. **Given** React project is initialized, **When** configuration tools are installed, **Then** Tailwind CSS, React Router, i18next are available and configured
3. **Given** frontend is configured, **When** development server starts, **Then** application is served on http://localhost:3000 with hot reload enabled
4. **Given** i18n is configured, **When** language files are created, **Then** i18n/en.json and i18n/ar.json support English and Arabic translations
5. **Given** React Router is configured, **When** routes are defined, **Then** navigation works between pages (landing, login, chat, profile)

---

### User Story 3 - Full Stack Execution with Single Command (Priority: P1)

A developer can start both backend and frontend services with a single `./run.sh` command, managing both processes and providing clear startup feedback.

**Why this priority**: Critical requirement for local development workflow. Developers must be able to start the entire application with one command. This is essential for onboarding, testing, and demonstrations. Dependency: requires User Stories 1 and 2 to be complete.

**Independent Test**: Can be fully tested by: (1) Running `./run.sh`, (2) Verifying both backend and frontend start, (3) Confirming services are accessible on their ports, (4) Verifying output logs show startup status. Delivers: a single command that runs the entire application locally.

**Acceptance Scenarios**:

1. **Given** backend virtual environment is set up, **When** run.sh is executed, **Then** Python virtual environment is activated and backend starts
2. **Given** frontend dependencies are installed, **When** run.sh is executed, **Then** React development server starts with hot reload enabled
3. **Given** both services start, **When** run.sh completes initialization, **Then** console displays ONLY these two status lines: "Backend running on http://127.0.0.1:8000" and "Frontend running on http://localhost:3000" (verbose service logs are suppressed)
4. **Given** run.sh is executing, **When** user presses Ctrl+C, **Then** both backend and frontend gracefully shut down
5. **Given** run.sh is executed on a fresh clone, **When** pending database migrations exist, **Then** migrations are automatically applied before backend starts (idempotent behavior on subsequent runs)

---

### User Story 4 - Environment Variables & Secrets Configuration (Priority: P2)

A developer can create and manage environment variables for API keys, secret keys, database configuration, and AI model selections securely and persistently.

**Why this priority**: Essential for security and configuration management. Without proper .env setup, the application cannot access external AI APIs or operate securely. This must work before phase 1 (authentication) begins.

**Independent Test**: Can be fully tested by: (1) Creating .env file, (2) Loading environment variables in backend, (3) Verifying secrets are not exposed in code. Delivers: secure environment variable management that complies with Constitution Principle V (Security & Privacy).

**Acceptance Scenarios**:

1. **Given** project root exists, **When** .env file is created, **Then** it contains required variables: OPENROUTER_API_KEY, GROQ_API_KEY, TOGETHER_API_KEY, SECRET_KEY, JWT_SECRET, DEFAULT_MODEL
2. **Given** .env exists with filled values, **When** backend loads configuration, **Then** environment variables are accessible via Django settings without hardcoding
3. **Given** .env file exists, **When** git status is checked, **Then** .env is in .gitignore and not tracked by version control
4. **Given** backend is running, **When** environment variables are accessed, **Then** they are loaded from .env file and API keys are never logged or exposed

---

### Edge Cases

- What happens when Python version is < 3.10? → Deploy clear error message directing user to upgrade
- What happens when Node.js version is < 18? → Deploy clear error message directing user to install LTS
- What happens when run.sh is executed but backend is already running on port 8000? → Detect port conflict and ask user to kill existing process or use different port
- What happens when virtual environment activation fails? → Provide fallback instructions for manual activation
- What happens when environment variables file (.env) is missing? → Create template with guidance rather than failing silently
- What happens when database migrations fail? → Provide rollback and debugging instructions

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide project root structure with `frontend/`, `backend/`, `specs/`, `.env`, `run.sh`, `README.md`, `.gitignore` directories and files
- **FR-002**: Backend setup MUST complete Python virtual environment creation with all dependencies installed (django, djangorestframework, djangorestframework-simplejwt, django-cors-headers, python-dotenv, requests)
- **FR-003**: Backend MUST initialize Django project structure with modular apps (users, chats, ai, summaries, api) that follow clean architecture principles per Constitution Principle I
- **FR-004**: Backend MUST run successful database migrations and initialize SQLite database schema
- **FR-005**: Backend MUST serve Django development server on http://127.0.0.1:8000 responding to HTTP requests
- **FR-006**: Frontend setup MUST complete React project initialization with all dependencies installed (react-router-dom, axios, i18next, react-i18next, tailwindcss, postcss, autoprefixer)
- **FR-007**: Frontend MUST configure React Router with routes for landing page, authentication, chat interface, and user profile
- **FR-008**: Frontend MUST configure i18n with JSON translation files supporting English (i18n/en.json) and Arabic (i18n/ar.json) per Constitution Principle II
- **FR-009**: Frontend MUST configure Tailwind CSS as the primary styling framework aligned with nexus brand identity per Constitution Principle III
- **FR-010**: Frontend MUST serve React development server on http://localhost:3000 with hot module reloading enabled
- **FR-011**: System MUST provide a `run.sh` script that: (1) activates Python virtual environment, (2) detects and applies pending database migrations (idempotent), (3) starts Django backend, (4) starts React frontend, (5) outputs only status messages ("Backend running on http://127.0.0.1:8000", "Frontend running on http://localhost:3000"), suppressing verbose service logs
- **FR-012**: System MUST manage environment variables through a `.env` file that includes API keys, secrets, database config, and AI model defaults per Constitution Principle V
- **FR-013**: System MUST load environment variables using python-dotenv in backend without hardcoding sensitive values
- **FR-014**: System MUST exclude `.env`, `venv/`, `node_modules/`, `__pycache__/`, `db.sqlite3` from git tracking via `.gitignore`
- **FR-015**: System MUST initialize Git repository and create initial README.md with setup instructions
- **FR-016**: System MUST run automated preflight checks (built into `run.sh` or an invoked helper) that verify Node.js ≥ 18, npm ≥ 9, and Python ≥ 3.10, printing guidance and exiting before any setup step if requirements are not met

### Key Entities

- **Development Environment**: The local machine setup including required software (Node.js, Python, Git) and their versions
- **Virtual Environment**: Python venv isolated dependency container for backend
- **Database (SQLite)**: Local development database file at `backend/db.sqlite3`
- **Environment Variables**: `.env` file containing API keys, secrets, configuration values
- **Django Project**: Backend REST API container with modular apps
- **React Project**: Frontend SPA container with router, i18n, styling
- **run.sh Script**: Orchestration script that manages both backend and frontend processes

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Backend server starts successfully and responds to HTTP requests within 30 seconds of initialization with zero errors in console
- **SC-002**: Frontend server starts successfully with hot reload enabled and loads without errors within 20 seconds of initialization
- **SC-003**: `./run.sh` successfully starts both backend and frontend with a single command, with both services fully operational within 60 seconds
- **SC-004**: All Django migrations apply successfully with zero database errors
- **SC-005**: All environment variables load correctly from .env file with zero hardcoded secrets in source code
- **SC-006**: Project structure matches specification with all required directories and files present
- **SC-007**: Git repository is initialized with .gitignore properly configured (verified by `git status` showing .env and dependencies are ignored)
- **SC-008**: README.md includes setup instructions, software requirements, environment variable guide, and run.sh usage documentation
- **SC-009**: Automated preflight checks in `run.sh` verify Node.js ≥ 18, Python ≥ 3.10, and npm ≥ 9 before any setup begins, exiting early with guidance when requirements are not met
- **SC-010**: Setup process completes without manual intervention from developer (automated installation of dependencies)

---

## Assumptions

- **A-001**: Developers have administrative access to their machines and can install software globally
- **A-002**: Target development platform is macOS, Linux, or Windows with WSL2 (Windows Subsystem for Linux)
- **A-003**: Developers are familiar with command-line tools and shell scripting (bash/PowerShell)
- **A-004**: Internet connectivity is available for downloading npm packages and Python dependencies
- **A-005**: SQLite is available on all development machines (standard in Python and Node.js)
- **A-006**: Git is pre-installed or will be installed as part of system setup
- **A-007**: Phase 0 does NOT include: authentication logic, chat functionality, AI integration, UI implementation, or production deployment
- **A-008**: Phase 0 focuses ONLY on development environment setup; subsequent phases handle feature implementation
- **A-009**: Backend will use latest stable Django and DRF versions per Constitution Principle IV
- **A-010**: Frontend will use latest stable React version and modern tooling per Constitution Principle IV
- **A-011**: All dependencies must comply with Constitution requirements (modular architecture, clean code, modern tooling)
- **A-012**: Environment variables follow Constitution Principle V (Security & Privacy) with no secrets exposed in code

---

## Context & Alignment

**Constitutional Alignment**:

- **Principle I** (Multi-Model Architecture): Environment setup creates modular backend structure with separate Django apps for users, chats, AI, summaries
- **Principle II** (Bilingual): i18n configuration supports English/Arabic with JSON translation files from the start
- **Principle III** (Brand-Driven UX): Tailwind CSS configured for nexus brand visual language implementation
- **Principle IV** (Modern Tech Stack): Uses latest stable versions of React, Django, Node.js per specification
- **Principle V** (Security & Privacy): Environment variables and .env setup follows security best practices; no hardcoded secrets

**Dependencies**: Phase 0 is the blocking prerequisite for all subsequent phases. No other features can be developed until environment setup is complete.

**Related Documentation**: See root-level `constitution.md`, `brand_identity_chatbot_genz.html`, and project README for detailed architecture and design principles.
