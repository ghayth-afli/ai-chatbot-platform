## Implementation Clarifications (Phase 0 → Phase 1 Refinements)

**Reference**: All clarifications integrated into spec.md from `/speckit.clarify` session

### C1: Account Linking Strategy (Email + Google OAuth)

If user has email/password account with `email@example.com` and later signs in with Google using same email:

- **Strategy**: MERGE accounts (one user record, both auth methods)
- **Implementation**: In GoogleOAuthView, lookup user by email first. If found, update `auth_provider='both'` (or store array). Do NOT create duplicate.
- **Task Impact**: T077-T082 (Google OAuth tests/views must handle account merge)

### C2: Token Refresh on Access Token Expiry (15 min)

When access token expires while user is using the app:

- **Strategy**: Auto-refresh silently (axios interceptor)
- **Flow**: Request fails (401) → frontend calls `/api/auth/refresh` → new token set in cookie → retry original request
- **UX**: No interruption, no error message shown to user
- **Implementation**: axios interceptor (T049-T050) handles this automatically
- **Task Impact**: Backend must support refresh endpoint; frontend must wire interceptor

### C3: RTL Layout for Arabic Forms

Frontend forms must support both EN (LTR) and AR (RTL):

- **Strategy**: CSS-driven RTL only (no HTML duplication)
- **Approach**: Add `dir={language === 'ar' ? 'rtl' : 'ltr'}` to form container. Tailwind CSS auto-flips layout.
- **Example**:
  ```jsx
  <form dir={i18n.language === "ar" ? "rtl" : "ltr"}>
    <div className="flex flex-row-reverse">
      {" "}
      {/* RTL flips this */}
      <input />
      <label />
    </div>
  </form>
  ```
- **Task Impact**: T044, T066, T100, T101 must apply `dir` attribute + RTL CSS classes

### C4: Race Condition - Concurrent Code Submissions

If user submits same verification code from 2 tabs simultaneously:

- **Strategy**: First wins, second fails (atomic database handling)
- **Behavior**: Tab 1 succeeds → marks code `is_used=true`. Tab 2 receives `INVALID_CODE` error.
- **Implementation**: Database transaction ensures atomicity. Check `is_used` before processing.
- **Task Impact**: T020 (verify_code utility) must implement atomic `is_used` check

---

# Implementation Plan: User Authentication & Authorization

**Branch**: `003-user-auth` | **Date**: March 28, 2026 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-user-auth/spec.md`

## Summary

Implement a secure authentication system supporting email/password and Google OAuth, with email verification, password reset, and cookie-based sessions. Users authenticate via `/api/auth/*` endpoints, receive HTTP-only authentication cookies, and access protected resources. Email verification uses 6-digit codes delivered via email service. Frontend implements login/signup flow with bilingual support (EN/AR) adhering to nexus brand identity.

## Technical Context

**Language/Version**: Python 3.11 (Django 5.0.2) backend; JavaScript/React 18.2.0 frontend  
**Primary Dependencies**:

- Backend: Django REST Framework 3.14.0, djangorestframework-simplejwt 5.5.1, python-decouple, Pillow
- Frontend: React Router 6, Axios, react-i18next
- Email: Django email backend (configurable: SMTP, SES, SendGrid)

**Storage**: SQLite (dev), PostgreSQL (production) for User model and VerificationCode model  
**Testing**: pytest-django (backend), Playwright E2E (frontend)  
**Target Platform**: Web application (server: Linux, browsers: Chrome/Firefox/Safari/Edge)  
**Project Type**: Full-stack web application with REST API backend and React SPA frontend  
**Performance Goals**: Authentication endpoint <200ms p95; email delivery <2 minutes; Google OAuth <3 seconds  
**Constraints**:

- Rate limiting: 5 login attempts per 15 minutes per IP; 3 code requests per 60 minutes per email
- Token expiration: access_token 15 minutes, refresh_token 7 days
- Verification codes: 10-minute TTL
- Password minimum: 8 characters

**Scale/Scope**:

- Supports multi-language (EN/AR with RTL)
- ~15 new API endpoints
- ~8 new frontend pages/modals
- ~25 database models/fields additions
- Cross-browser mobile and desktop support

## Constitution Check

**Gate Review Against Project Constitution**:

| Principle                      | Status  | Notes                                                                      |
| ------------------------------ | ------- | -------------------------------------------------------------------------- |
| Multi-model AI platform        | ✅ PASS | Auth enables user accounts for multi-model chat access                     |
| Bilingual by default (EN/AR)   | ✅ PASS | Email templates and UI pages support EN/AR; RTL verified                   |
| Chat history saved             | ✅ PASS | Auth connects User → ChatSession → Message; privacy enforced               |
| User profile with summary      | ✅ PASS | User model extended with auth fields; Profile model updated                |
| Clean modern UI (ChatGPT-like) | ✅ PASS | Login/signup UI designed to match nexus brand (dark, minimal, volt accent) |
| Dark modern theme              | ✅ PASS | Auth pages adopt nexus color scheme (ink/paper/volt/plasma/etc.)           |
| Responsive design              | ✅ PASS | All auth forms mobile-first; tested at 360px and 1440px                    |
| Clean architecture             | ✅ PASS | Django apps separated: users app for auth logic; DRF for endpoints         |
| JSON i18n translation          | ✅ PASS | All UI text uses i18next keys; backend emails have locale templates        |
| Latest stable versions         | ✅ PASS | Django 5.0.2, React 18.2.0, simplest JWT 5.5.1 all latest stable           |

**Gate Evaluation**: ✅ **PASS** — All core principles satisfied; no conflicts detected.

## Project Structure

### Documentation (this feature)

```text
specs/003-user-auth/
├── spec.md              # Feature specification
├── plan.md              # This file (planning output)
├── research.md          # Phase 0: Research findings (TBD)
├── data-model.md        # Phase 1: Data model design (TBD)
├── quickstart.md        # Phase 1: Implementation quickstart (TBD)
├── contracts/           # Phase 1: API contracts and endpoint specs (TBD)
│   ├── auth-endpoints.md
│   └── error-responses.md
└── checklists/
    └── requirements.md  # Specification validation checklist
```

### Source Code

```text
backend/
├── users/               # Authentication app (existing models, add auth views)
│   ├── models.py        # User, Profile, VerificationCode models
│   ├── serializers.py   # UserSerializer, LoginSerializer, SignupSerializer
│   ├── views.py         # Auth endpoints (register, verify, login, logout, forgot-password, reset-password)
│   ├── urls.py          # Route auth endpoints
│   └── tests/
│       ├── test_signup.py
│       ├── test_login.py
│       ├── test_oauth.py
│       └── test_password_reset.py
├── api/
│   ├── urls.py          # Include users.urls under /api/auth
│   └── exception_handlers.py  # Centralized error responses
└── config/
    ├── settings.py      # Add SIMPLE_JWT, EMAIL, CORS configs
    ├── celery.py        # Background email tasks (optional)
    └── emails.py        # Email template rendering (send_verification_email, etc.)

frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx         # Login form with email/password; Google OAuth button
│   │   ├── Signup.jsx        # Signup form; email verification flow
│   │   ├── VerifyEmail.jsx   # Email code verification page
│   │   ├── ForgotPassword.jsx    # Forgot password form
│   │   ├── ResetPassword.jsx     # Reset password form
│   │   └── Profile.jsx       # User profile (existing, update with auth)
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   ├── GoogleOAuthButton.jsx
│   │   │   └── AuthGuard.jsx
│   │   └── (other components)
│   ├── services/
│   │   ├── authService.js    # API calls to /api/auth/* endpoints
│   │   └── axiosConfig.js    # Token injection, refresh logic
│   ├── hooks/
│   │   ├── useAuthStatus.js  # Real implementation (currently mock)
│   │   └── useLanguage.js    # Existing i18n hook
│   ├── i18n/
│   │   ├── translations/
│   │   │   ├── en.json       # Add auth keys (login, signup, verify, etc.)
│   │   │   └── ar.json       # Arabic translations
│   │   └── config.js         # Existing, no changes
│   ├── App.jsx               # Add route guards
│   └── tests/
│       ├── pages/Login.test.jsx
│       ├── pages/Signup.test.jsx
│       ├── e2e/auth.spec.ts  # Playwright E2E tests
│       └── services/authService.test.js
```

**Structure Decision**: Web application (backend + frontend) following Django DRF + React patterns. Auth logic isolated in `users` Django app. Frontend auth pages in dedicated `/pages` and `/components/auth/` folders. Shared API client in `services/authService.js` allows reuse across multiple pages.

## Complexity Tracking

No violations of project constitution. All design choices follow established patterns (Django DRF, React Router, i18next). No additional projects or unusual complexity required.

---

## Phase 0: Research (Discovering & Clarifying Unknowns)

The specification is well-defined. Research phase will:

1. **Email Service Integration**: Determine SES vs SendGrid vs SMTP; configure in Django settings
2. **Google OAuth Configuration**: Obtain Client ID/Secret from Google Cloud Console; environment variables
3. **JWT Token Strategy**: Access token (15 min), refresh token (7 days); blacklist strategy optional
4. **Cookie Security**: Verify SameSite, Secure, HttpOnly flags work cross-domain (if needed)
5. **Rate Limiting**: Choose library (django-ratelimit or DRF throttling classes)

→ **Output**: `research.md` (Phase 0 completion)

---

## Phase 1: Design & Contracts

### Data Model (`data-model.md`)

- **VerificationCode**: id, user_id, code, type (verify/reset), expires_at, created_at
- **User**: Extend Django User with oauth_provider, google_profile_picture fields
- **AuthToken**: Optional model for JWT blacklist (logout implementation)
- Relationships and validation rules

### API Contracts (`contracts/auth-endpoints.md`)

- POST `/api/auth/signup` — Request/response format
- POST `/api/auth/verify-email` — Request/response
- POST `/api/auth/login` — Request/response with cookie headers
- POST `/api/auth/logout` — Request/response
- POST `/api/auth/forgot-password` — Request/response
- POST `/api/auth/reset-password` — Request/response
- POST `/api/auth/google` — Google OAuth token exchange
- GET `/api/auth/me` — Current user info
- Error responses with standardized error codes

### Implementation Quick Start (`quickstart.md`)

- Django settings configuration (SIMPLE_JWT, EMAIL, CORS)
- Model migrations and creation
- Endpoint implementation checklist
- Frontend setup (axios interceptors, token storage)
- Testing strategy

### Design Decisions

- Cookie vs Header: HTTP-only cookies for security (not localStorage)
- Token refresh: Automatic via axios interceptor on 401
- Email verification: 6-digit codes, 10-minute TTL
- Google OAuth: Backend token exchange (frontend redirect → backend confirm)
- Rate limiting: DRF throttling classes (builtin, no external library)

→ **Output**:

- `data-model.md`
- `contracts/auth-endpoints.md`
- `contracts/error-responses.md`
- `quickstart.md`

### Agent Context Update

After Phase 1 design, run: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`

- Adds Phase 3 auth technologies to agent context
- Preserves manual additions between markers

---

## Phase 2: Task Generation (Next Command)

After Phase 1 design artifacts are complete, run `/speckit.tasks` to generate:

- `tasks.md` with dependency-ordered implementation tasks
- Task breakdown by backend/frontend/testing
- Story point estimation
- Deployment checklist

---

**Next Steps**:

1. Proceed with Phase 0 Research → generates `research.md`
2. Proceed with Phase 1 Design → generates `data-model.md`, `contracts/`, `quickstart.md`
3. Proceed with Phase 2 Tasks → generates `tasks.md`
4. Proceed with Implementation → use `/speckit.implement` to execute tasks
