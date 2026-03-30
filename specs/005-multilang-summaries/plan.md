# Implementation Plan: Multi-Language User Profiles with AI-Generated Summaries

**Branch**: `005-multilang-summaries` | **Date**: March 30, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-multilang-summaries/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Display personalized AI-generated summaries of user interactions in the user's chosen language (English or Arabic). Implement multi-language support with language tagging in chat history, rate limiting (100 req/min uniform), and Formal Modern Standard Arabic (MSA) with RTL text rendering. Backend: Django REST APIs with language context; frontend: React profile page with archive capability. Scale: ~50K MAU, ~5M msgs/month.

## Technical Context

**Language/Version**: Python 3.11 (backend), JavaScript/React (frontend)  
**Primary Dependencies**: Django REST Framework, React, i18next (i18n), Axios, Tailwind CSS  
**Storage**: SQLite (existing) - extend User model with language_preference; Chat/Session models tagged with language_tag; new UserSummary model with archive_status  
**Testing**: pytest (backend), Playwright/Jest (frontend)  
**Target Platform**: Web application (existing nexus platform)  
**Project Type**: Web application feature (Python backend + React frontend)  
**Performance Goals**: Summary display <2s, error responses <500ms, summary generation <10min, 99% rate limit accuracy  
**Constraints**: Uniform rate limiting (100 req/min); support existing JWT auth; no new external dependencies for translation (AI model handles both languages)  
**Scale/Scope**: ~50,000 MAU Y1, ~5M messages/month, ~500 peak concurrent users

## Constitution Check

**GATE STATUS**: ✅ **PASS** - No violations detected. Feature advances core principles II and V.

| Principle                                    | Check                                                      | Status          | Notes                                                                                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Multi-Model AI Architecture               | Does feature require changes to AI routing?                | ✅ Pass         | Feature works with existing Django REST → AI APIs pattern; language context passed through request headers                                                    |
| II. Bilingual & Internationalized by Default | Does feature implement i18n and RTL/LTR support?           | ✅ Advance      | Feature embodies this principle: language_preference persistence, language_tag metadata, Formal MSA + RTL for Arabic, English LTR, i18next integration for UI |
| III. Brand-Driven Modern UX                  | Does feature follow nexus brand identity?                  | ⚠️ Design Phase | Profile page must use nexus design tokens (dark theme, neon accents, glass surfaces); RTL layout for Arabic. Verified in Phase 1 design                       |
| IV. Modern Tech Stack                        | Does feature use latest stable versions?                   | ✅ Pass         | Uses latest: React (latest), Django (latest), i18next (latest), Tailwind CSS (latest); no deprecated patterns                                                 |
| V. Security & Privacy                        | Does feature maintain auth, rate limiting, data isolation? | ✅ Strengthen   | Feature adds rate limiting (100 req/min uniform); language metadata isolated per user; existing JWT auth sufficient; user data remains user-owned             |

**Gate Evaluation**: All principles satisfied or advanced. Configuration constraint (brand compliance) deferred to Phase 1 design review.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── ai/
│   ├── models.py                    # Extend: User model + new UserSummary model
│   ├── services/
│   │   ├── summary_service.py       # NEW: AI summary generation (batch after session)
│   │   └── language_service.py      # NEW: Language tagging, localization helpers
│   ├── views.py                     # Extend: profile endpoint with language context
│   ├── serializers.py               # Extend: UserSummary, Chat Message serializers
│   └── tests/
│       ├── test_summary_generation.py
│       ├── test_language_tagging.py
│       └── test_rate_limiting.py
├── common/
│   └── middleware/
│       ├── rate_limiter.py          # NEW: 100 req/min rate limiting middleware
│       └── language_context.py      # NEW: Extract & attach language from user profile
├── requirements.txt                 # Extend: add any new dependencies if needed

frontend/
├── src/
│   ├── components/
│   │   └── ProfileSummary/          # NEW component for displaying AI summaries
│   │       ├── ProfileSummary.tsx
│   │       ├── SummaryCard.tsx      # Individual summary with archive button
│   │       └── ProfileSummary.css
│   ├── features/
│   │   ├── profile/
│   │   │   ├── ProfilePage.tsx      # Extend: add AI summary section
│   │   │   └── LanguageSelector.tsx # Extend: add language preference setter
│   │   └── chat/
│   │       ├── ChatInput.tsx        # Extend: pass language context to queries
│   │       └── ChatMessage.tsx      # Extend: display language tag in metadata
│   ├── services/
│   │   ├── profileService.ts        # Extend: fetch summaries with language filter
│   │   ├── summaryService.ts        # NEW: manage summary archive
│   │   └── chatService.ts           # Extend: include language_tag in requests
│   ├── hooks/
│   │   ├── useLanguagePreference.ts # NEW: React hook for language selection
│   │   └── useUserSummaries.ts      # NEW: React hook to fetch/display summaries
│   ├── i18n/
│   │   ├── en.json                  # Extend: add multilang profile strings
│   │   └── ar.json                  # Extend: add Arabic translations
│   └── tests/
│       ├── ProfileSummary.test.tsx
│       ├── summaryService.test.ts
│       └── useLanguagePreference.test.ts

tests/
├── integration/
│   └── test_multilang_user_profile.py
└── security/
    └── test_rate_limiting.py
```

**Structure Decision**: Web application (backend + frontend) following existing nexus platform structure.

- **Backend**: Extends existing Django apps (ai, users, common) with new services for summary generation, language tagging, and rate limiting middleware.
- **Frontend**: Extends profile feature with React ProfileSummary component; extends chat feature with language preference/context passing; updates i18n files for both languages.
- **Tests**: Integration tests verify end-to-end multilang flows; security tests verify rate limiting.
- **No new projects**: Feature fits entirely within existing backend/frontend structure; no new microservices needed for Y1.

## Complexity Tracking

**Status**: ✅ No violations detected - not applicable.

---

## Planning Phase Completion Status

**Date Completed**: March 30, 2026  
**Overall Status**: ✅ **COMPLETE - Ready for Implementation**

### Phase 0: Research (✅ Complete)

**Artifacts**:

- `research.md` — 8 technology decisions with full rationale, alternatives considered, risk mitigations
- All NEEDS CLARIFICATION items resolved
- Best practices documented for MSA, RTL, rate limiting, async summary generation

### Phase 1: Design & Contracts (✅ Complete)

**Artifacts**:

- `data-model.md` — Complete schema for 5 entities
- `contracts/` (3 files) — All API endpoints specified with full request/response contracts
- `quickstart.md` — 4-phase implementation guide (2-3 weeks)

**Outcomes**:

- ✅ All database relationships defined with migrations
- ✅ All API contracts specified (GET/POST/DELETE with error handling)
- ✅ Clear implementation phases with timeline
- ✅ Testing strategy documented
- ✅ Agent context updated for Copilot

### Constitution Re-Check (✅ Passed)

All 5 principles satisfied; feature **advances** Principle II (Bilingual & Internationalized by Default) and **strengthens** Principle V (Security & Privacy).

---

## Deliverables

| Artifact             | Status       | Content                                                  |
| -------------------- | ------------ | -------------------------------------------------------- |
| spec.md              | ✅           | 5 user stories, 15 FR, 10 success criteria               |
| plan.md              | ✅           | Technical context, Constitution check, project structure |
| research.md          | ✅           | 8 tech decisions with rationale                          |
| data-model.md        | ✅           | 5 entities, migrations, indexes, scalability             |
| contracts/ (3 files) | ✅           | User profiles, chat language tagging, rate limiting      |
| quickstart.md        | ✅           | 4-phase implementation with code examples                |
| **Total**            | **✅ READY** | ~2000 lines of design documentation                      |

---

## Sign-Off

**Status**: ✅ **APPROVED FOR IMPLEMENTATION**

**Risk Assessment**: Low risk; fits existing architecture; no external dependencies.  
**Estimated Timeline**: 2-3 weeks  
**Next Step**: Generate tasks (`/speckit.tasks`) or begin implementation
