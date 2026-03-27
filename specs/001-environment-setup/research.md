# Research: Phase 0 — Environment Setup

**Date**: 2026-03-27  
**Status**: Complete  
**Previous Session**: /speckit.clarify resolved all ambiguities

---

## Summary

Phase 0 research validates that all technical decisions are sound and require no further clarification. The /speckit.clarify session (Session 2026-03-27) resolved 3 high-impact questions:

1. **Database Migration Strategy**: Confirmed automated idempotent detection in run.sh
2. **Cross-Platform Support**: Confirmed bash-only per WSL2 requirement
3. **Logging Output**: Confirmed minimal status messages for clean developer experience

No additional research needed. All specification requirements are now fully clarified and ready for detailed design.

---

## Research Findings

### Q1: Database Migration Automation (RESOLVED ✅)

**Question**: Should database migrations happen automatically in run.sh or manually?

**Decision**: **Automated with idempotent detection** (Option A — smart detection)

**Rationale**:

- SC-010 states "setup completes without manual intervention"
- SC-003 expects run.sh to start both services seamlessly in < 60 seconds
- Idempotent behavior allows developers to run `./run.sh` repeatedly during development without re-running migrations
- First run: Applies all pending migrations automatically
- Subsequent runs: Detects no pending migrations, starts servers immediately
- Modern development best practice used by industry-leading platforms (Rails, Laravel, Django Docker)

**Implementation**: FR-011 now specifies:

- run.sh activates venv
- Runs `python manage.py migrate --check` to detect pending migrations
- If pending migrations exist, runs `python manage.py migrate`
- Starts backend and frontend services
- Outputs only status messages (suppresses verbose logs)

---

### Q2: Cross-Platform Shell Support (RESOLVED ✅)

**Question**: Should run.sh support Windows natively or require WSL2 only?

**Decision**: **Bash-only per WSL2 requirement** (Option A)

**Rationale**:

- Assumption A-002 explicitly specifies "Windows with WSL2"
- Bash is universally available: macOS, Linux, WSL2
- Bash is standard for development environments
- Dual script maintenance (run.sh + run.ps1) adds complexity for Phase 0
- Future phases can add Windows batch support if needed, but Phase 0 focuses on essential setup

**Implementation**:

- run.sh is bash-only script
- Windows developers use WSL2 (documented in README)
- Documentation includes WSL2 setup instructions

---

### Q3: Logging Output Strategy (RESOLVED ✅)

**Question**: What should console output show when run.sh starts both services?

**Decision**: **Minimal status messages only** (Option A)

**Rationale**:

- Developer experience: Verbose logs during startup are overwhelming
- Debugging: Developers can review logs in separate files or use dev tools
- Clean output enables clear verification that services started correctly
- Aligns with SC-003: "Console shows startup status"
- Modern development practice: Docker, nodemon, and development servers use minimal startup output

**Output Format** (per Clarifications session):

```
Backend running on http://127.0.0.1:8000
Frontend running on http://localhost:3000
```

**Implementation**:

- run.sh redirects service logs to files (backend.log, frontend.log) or /dev/null
- Only startup status messages appear in console
- Developers can tail logs separately if needed: `tail -f backend.log`

---

## Technology Validation

### Frontend Stack

| Technology      | Justification                                                                | Status       |
| --------------- | ---------------------------------------------------------------------------- | ------------ |
| React (latest)  | Constitution Principle IV (latest versions); industry standard for modern UX | ✅ Confirmed |
| Node.js 18+ LTS | Latest LTS; widely supported; excellent npm ecosystem                        | ✅ Confirmed |
| npm 9+          | Latest stable; improved dependency resolution                                | ✅ Confirmed |
| React Router    | Standard for React SPA routing per spec requirement                          | ✅ Confirmed |
| Tailwind CSS    | Constitution Principle III (brand implementation); utility-first CSS         | ✅ Confirmed |
| i18next         | Standard i18n solution; supports EN/AR; JSON file format per spec            | ✅ Confirmed |
| Axios           | Lightweight HTTP client; promise-based; easy error handling                  | ✅ Confirmed |

### Backend Stack

| Technology                    | Justification                                               | Status       |
| ----------------------------- | ----------------------------------------------------------- | ------------ |
| Python 3.10+                  | Constitution Principle IV (latest); excellent async support | ✅ Confirmed |
| Django (latest)               | Industry-standard web framework; batteries-included ORM     | ✅ Confirmed |
| Django REST Framework         | Standard DRF; RESTful API conventions                       | ✅ Confirmed |
| djangorestframework-simplejwt | Production-grade JWT authentication per spec                | ✅ Confirmed |
| django-cors-headers           | Handles CORS for React frontend                             | ✅ Confirmed |
| python-dotenv                 | Constitution Principle V (environment variable management)  | ✅ Confirmed |
| SQLite                        | Default for development; no external DB required            | ✅ Confirmed |

### Testing Stack

| Technology            | Justification                              | Status       |
| --------------------- | ------------------------------------------ | ------------ |
| pytest                | Standard Python testing, works with Django | ✅ Confirmed |
| Jest                  | React standard testing runner              | ✅ Confirmed |
| React Testing Library | Modern component testing best practice     | ✅ Confirmed |

---

## Constitutional Compliance Summary

**All 5 principles validated for Phase 0**:

✅ **Principle I** — Modular Django apps structure established  
✅ **Principle II** — i18n infrastructure ready (EN/AR translation files)  
✅ **Principle III** — Tailwind CSS configured for brand implementation  
✅ **Principle IV** — All latest stable versions selected  
✅ **Principle V** — .env secrets management with python-dotenv

---

## No Outstanding Clarifications

The /speckit.clarify session on 2026-03-27 identified 3 ambiguities and received clear answers:

- Q1: Automated migrations with idempotent detection → **A**
- Q2: Bash-only (WSL2 requirement) → **A**
- Q3: Minimal logging output → **A**

All clarifications have been integrated into spec.md and plan.md. **Zero ambiguities remain.**

---

## Ready for Design Phase

All research is complete. Phase 0 is ready to proceed to:

- **Phase 1**: Generate data-model.md, contracts/, quickstart.md
- **Phase 2**: Generate tasks.md and task breakdown

**Next Command**: No further clarifications needed. Proceed to `/speckit.plan` Phase 1 design artifacts.
