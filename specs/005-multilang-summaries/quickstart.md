# Developer Quickstart: Multi-Language User Profiles with AI-Generated Summaries

**Feature**: 005-multilang-summaries  
**Version**: 1.0  
**Last Updated**: March 30, 2026

## Overview

This guide helps developers implement the multi-language user profiles feature for the nexus AI chat platform. The feature adds:

1. **Language preference management** (English/Arabic per user)
2. **Language-tagged chat history** (all messages marked with language)
3. **AI-generated user summaries** (in user's preferred language)
4. **Rate limiting** (uniform 100 req/min across all endpoints)
5. **RTL text support** (Arabic right-to-left rendering)

**Estimated Implementation Time**: 2-3 weeks (backend + frontend + testing)

---

## Architecture Overview

```
User Action                → Backend Service              → Frontend Display
─────────────────────────────────────────────────────────────────────────
1. Sets language pref      → User.language_preference     → i18n switches UI
2. Sends message           → language_tag added           → Chat message appears
3. Views profile           → UserSummary queryset         → Profile Summary component
4. Rate limited (100 req)  → Middleware returns 429       → "Try again in 60s" message

┌─────────────────────────────────────────────────────────────────┐
│ Backend: Django REST Framework                                   │
│ ├── Models: User (extended), ChatMessage (+ language_tag)       │
│ ├── Models: ChatSession (+ language_tag, message_count)         │
│ ├── Models: UserSummary (NEW)                                   │
│ ├── Middleware: rate_limiter.py, language_context.py           │
│ ├── Services: summary_service.py, language_service.py          │
│ └── API Endpoints: POST /api/chat/send, GET /api/users/{}/profile/summary
│                                                                   │
│ Frontend: React + Tailwind CSS                                  │
│ ├── Components: ProfileSummary (display), SummaryCard (archive) │
│ ├── Features: profile/ (extend ProfilePage, LanguageSelector)   │
│ ├── Hooks: useLanguagePreference, useUserSummaries              │
│ ├── i18n: Translations in en.json, ar.json                      │
│ └── Services: profileService (extend), summaryService (new)     │
│                                                                   │
│ AI Integration: Existing                                        │
│ └── Prompt includes language context (MSA for Arabic)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Backend Data Model (Days 1-3)

**Goal**: Extend Django models; migrations; database schema

**Checklist**:

- [ ] Add `language_preference` to User model
- [ ] Add `language_tag` to ChatMessage model
- [ ] Add `language_tag`, `message_count` to ChatSession model
- [ ] Create UserSummary model (new)
- [ ] Write and test migrations
- [ ] Add database indexes for language_tag queries
- [ ] Backfill existing data (language_preference='en' for all users)

**Key Files to Modify**:

- `backend/ai/models.py` — Add User fields, UserSummary model
- `backend/ai/migrations/000X_add_language_fields.py` — Create migrations
- `backend/conftest.py` — Update test fixtures

**Testing**:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate --dry-run  # Verify safety
python manage.py migrate
pytest tests/ -k "test_language_tag"
```

---

### Phase 2: Backend Services & Middleware (Days 4-7)

**Goal**: Implement language routing, rate limiting, summary generation

**Checklist**:

- [ ] Create `summary_service.py` (batch summary generation from AI)
- [ ] Create `language_service.py` (language tagging, localization helpers)
- [ ] Create `rate_limiter.py` middleware (100 req/min enforcement)
- [ ] Create `language_context.py` middleware (extract language from JWT, attach to request)
- [ ] Extend `/api/chat/send` endpoint to include language in response
- [ ] Extend `/api/users/{}/profile` endpoint to return summaries
- [ ] Add new endpoints: POST/DELETE archive summary
- [ ] Wire up async task for summary generation (Celery or APScheduler)

**Key Files to Create/Modify**:

- `backend/ai/services/summary_service.py` — NEW
- `backend/ai/services/language_service.py` — NEW
- `backend/common/middleware/rate_limiter.py` — NEW
- `backend/common/middleware/language_context.py` — NEW
- `backend/ai/views.py` — Extend endpoints
- `backend/ai/serializers.py` — Add UserSummarySerializer
- `backend/requirements.txt` — Add new dependencies (if any)

**Testing**:

```bash
# Unit tests for services
pytest backend/ai/services/test_summary_service.py
pytest backend/common/middleware/test_rate_limiter.py

# Integration tests
pytest tests/integration/test_multilang_user_profile.py

# Load test rate limiter
ab -n 200 -c 10 http://localhost:8000/api/chat/history/
```

**Example: Language Context Middleware**:

```python
# backend/common/middleware/language_context.py
class LanguageContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Extract language from JWT context
        request.language = 'en'  # default
        if hasattr(request, 'user') and request.user.is_authenticated:
            request.language = getattr(request.user, 'language_preference', 'en')

        response = self.get_response(request)
        return response
```

**Example: Rate Limiter Middleware**:

```python
# backend/common/middleware/rate_limiter.py
from django.http import JsonResponse
from django.core.cache import cache
import time

class RateLimiterMiddleware:
    REQUESTS_PER_MINUTE = 100

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            user_id = request.user.id
            cache_key = f"rate_limit:{user_id}"
            now = time.time()

            # Get counter from cache (expires in 60sec)
            counter = cache.get(cache_key, {'count': 0, 'start': now})

            # Reset if window expired
            if now - counter['start'] > 60:
                counter = {'count': 0, 'start': now}

            # Check limit
            if counter['count'] >= self.REQUESTS_PER_MINUTE:
                error_msg = self._localize_error(request.user.language_preference)
                return JsonResponse({
                    'detail': error_msg,
                    'retry_after': 60
                }, status=429)

            # Increment counter
            counter['count'] += 1
            cache.set(cache_key, counter, 60)

        return self.get_response(request)

    def _localize_error(self, language):
        if language == 'ar':
            return "تم تجاوز حد معدل الطلب: 100 طلب في الدقيقة."
        return "Request rate limit exceeded: 100 requests per minute."
```

---

### Phase 3: Frontend Components (Days 8-12)

**Goal**: React components for profile summaries, language selection, RTL support

**Checklist**:

- [ ] Create `ProfileSummary` component (display summaries list)
- [ ] Create `SummaryCard` component (individual summary with archive button)
- [ ] Extend `ProfilePage` to include ProfileSummary section
- [ ] Create/extend `LanguageSelector` component
- [ ] Create `useLanguagePreference` hook (manage language preference)
- [ ] Create `useUserSummaries` hook (fetch/display summaries)
- [ ] Extend i18n files: `i18n/en.json`, `i18n/ar.json`
- [ ] Add RTL styles to Tailwind config (if not present)
- [ ] Test RTL rendering for Arabic strings

**Key Files to Create/Modify**:

- `frontend/src/components/ProfileSummary/ProfileSummary.tsx` — NEW
- `frontend/src/components/ProfileSummary/SummaryCard.tsx` — NEW
- `frontend/src/components/ProfileSummary/ProfileSummary.css` — NEW (or Tailwind classes)
- `frontend/src/features/profile/ProfilePage.tsx` — Extend
- `frontend/src/features/profile/LanguageSelector.tsx` — Extend
- `frontend/src/hooks/useLanguagePreference.ts` — NEW
- `frontend/src/hooks/useUserSummaries.ts` — NEW
- `frontend/src/services/profileService.ts` — Extend
- `frontend/src/services/summaryService.ts` — NEW
- `frontend/src/i18n/en.json` — Extend
- `frontend/src/i18n/ar.json` — Extend
- `tailwind.config.js` — Extend (RTL support if needed)

**Testing**:

```bash
# Frontend component tests
cd frontend
npm run test -- ProfileSummary.test.tsx
npm run test -- useLanguagePreference.test.ts

# E2E tests (Playwright)
npx playwright test tests/e2e/profile-multilang.spec.ts
```

**Example: ProfileSummary Component**:

```tsx
// frontend/src/components/ProfileSummary/ProfileSummary.tsx
import React from "react";
import { useUserSummaries } from "@/hooks/useUserSummaries";
import { useTranslation } from "react-i18next";
import SummaryCard from "./SummaryCard";

export default function ProfileSummary() {
  const { summaries, loading, error } = useUserSummaries();
  const { t } = useTranslation();

  if (loading) return <div>{t("common.loading")}</div>;
  if (error) return <div>{t("error.fetchSummaries")}</div>;

  return (
    <section className="profile-summary">
      <h2>{t("profile.summary_title")}</h2>
      {summaries.length === 0 ? (
        <p>{t("profile.no_summaries")}</p>
      ) : (
        <div className="summaries-list">
          {summaries.map((summary) => (
            <SummaryCard key={summary.id} summary={summary} />
          ))}
        </div>
      )}
    </section>
  );
}
```

**Example: i18n Translation Keys**:

```json
// frontend/src/i18n/en.json
{
  "profile": {
    "summary_title": "Your Interaction Summary",
    "no_summaries": "No summaries available yet. Start chatting to see insights!"
  },
  "error": {
    "fetchSummaries": "Failed to load summaries"
  }
}

// frontend/src/i18n/ar.json
{
  "profile": {
    "summary_title": "ملخص تفاعلاتك",
    "no_summaries": "لا توجد ملخصات متوفرة حالياً. ابدأ بالدردشة لرؤية رؤية ثاقبة!"
  },
  "error": {
    "fetchSummaries": "فشل في تحميل الملخصات"
  }
}
```

---

### Phase 4: Testing & Integration (Days 13-15)

**Goal**: End-to-end testing, performance validation, rate limit testing

**Checklist**:

- [ ] Write integration tests: User sets language → messages tagged → summaries generated
- [ ] Write security tests: Rate limiter prevents abuse
- [ ] Load test: 100 concurrent users, verify <2s summary load
- [ ] Verify Arabic MSA quality (manual review of AI summaries)
- [ ] Test RTL rendering across browsers (Chrome, Firefox, Safari)
- [ ] Performance profiling: middleware latency <50ms
- [ ] Test migrations on production-like data
- [ ] Document setup for deployment

**Test Files**:

- `tests/integration/test_multilang_user_profile.py`
- `tests/security/test_rate_limiting.py`
- `frontend/tests/e2e/profile-multilang.spec.ts`

**Example: Integration Test**:

```python
# tests/integration/test_multilang_user_profile.py
def test_arabic_user_profile_summary(client, user_ar, chat_session_ar):
    """Arabic user sees summary in MSA with RTL chars"""
    # User chats with 5+ messages
    for i in range(5):
        ChatMessage.objects.create(
            session=chat_session_ar,
            user=user_ar,
            role='user',
            content=f"سؤال {i}؟",
            language_tag='ar'
        )

    # Trigger summary generation
    generate_summaries()

    # Fetch profile
    response = client.get(f'/api/users/{user_ar.id}/profile/summary',
                         HTTP_AUTHORIZATION=f'Bearer {token_ar}')

    assert response.status_code == 200
    assert len(response.json()['summaries']) == 1

    summary = response.json()['summaries'][0]
    assert summary['language_tag'] == 'ar'
    # Verify MSA (no colloquialisms, formal tone)
    assert 'أنت' in summary['text']  # "You" in formal Arabic
```

---

## Key Implementation Details

### 1. Language Preference Persistence

Store in JWT token claims:

```python
# backend/users/views.py (login endpoint)
from rest_framework_simplejwt.tokens import RefreshToken

def login_view(request):
    ...
    refresh = RefreshToken.for_user(user)
    refresh['language_preference'] = str(user.language_preference)
    return Response({'access': str(refresh.access_token)})
```

### 2. Summary Generation Trigger

Async task, triggered after session ends:

```python
# backend/ai/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .tasks import generate_user_summary

@receiver(post_save, sender=ChatMessage)
def on_message_created(sender, instance, created, **kwargs):
    if created:
        instance.session.message_count += 1
        instance.session.save()

        # Trigger summary if 5+ messages
        if instance.session.message_count >= 5 and not instance.session.summary_generated:
            generate_user_summary.delay(instance.session.id)
```

### 3. RTL Support (Tailwind)

```js
// tailwind.config.js
module.exports = {
  content: [...],
  theme: {...},
  plugins: [],
  // If Arabic detected, set dir="rtl"
  // Tailwind will auto-flip margin/padding/float/text-align
};

// In component:
<div dir={language === 'ar' ? 'rtl' : 'ltr'}>
  {summaryText}
</div>
```

### 4. Rate Limit at Scale

For 50K users, in-memory counter suffices:

```python
# Cache key pattern: race_limit:{user_id}
# Expires after 60 seconds (built into cache.set)
# At 500 peak concurrent, counters = <1MB memory
```

If distributed (multiple app servers), use Redis:

```python
# backend/common/middleware/rate_limiter.py
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='100/m')
def protected_view(request):
    ...
```

---

## Testing Checklist

### Unit Tests

- [ ] `User.language_preference` validation
- [ ] `ChatMessage.language_tag` auto-assignment
- [ ] `UserSummary` archive toggle
- [ ] Rate limiter counter increment/reset
- [ ] Localization helpers (MSA format check)

### Integration Tests

- [ ] Full flow: Language preference → tagged messages → summary generation
- [ ] Multi-language session (English then Arabic messages)
- [ ] Rate limit enforcement (100 → 101 request)
- [ ] Archive/unarchive operations
- [ ] Error message localization

### Frontend Tests

- [ ] ProfileSummary component renders
- [ ] Language selector changes preference
- [ ] RTL rendering for Arabic
- [ ] Archive button functionality
- [ ] i18n keys all present

### E2E Tests (Playwright)

- [ ] User logs in → sets Arabic → chats → sees Arabic summary
- [ ] Rate limit: Rapid requests return 429
- [ ] Profile page loads in <2 seconds

---

## Deployment Checklist

- [ ] Migrations tested on production-like DB
- [ ] Redis/cache backend configured (if needed)
- [ ] Environment variables set: `RATE_LIMIT_REQUESTS=100`
- [ ] Async task worker (Celery/APScheduler) deployed and running
- [ ] i18n files translated (Arabic native speaker review)
- [ ] RTL CSS tested on target browsers
- [ ] Rate limiter tested under load
- [ ] Monitoring/alerting configured for new endpoints
- [ ] Documentation updated (API docs, README, deployment guide)

---

## Monitoring & Observability

### Key Metrics

```python
# Log rate limit hits
logger.info(f"Rate limit exceeded for user {user_id}")

# Monitor summary generation
logger.info(f"Summary generated for session {session_id} in {duration}ms")

# Track language distribution
print(f"Language usage: En={en_count}, Ar={ar_count}")
```

### Dashboard Queries

- Users by language preference (pie chart)
- Rate limit hits per hour (trend)
- Average summary generation latency (p50, p99)
- API response times by endpoint (heatmap)

---

## Common Issues & Troubleshooting

| Issue                      | Cause                          | Solution                                                    |
| -------------------------- | ------------------------------ | ----------------------------------------------------------- |
| Arabic text shows as boxes | Missing font or encoding       | Add Noto Sans Arabic to Tailwind fonts; verify UTF-8        |
| Summaries not generating   | Async task worker not running  | Check Celery/APScheduler process; verify signal connected   |
| Rate limit too strict      | Real users hitting 100 req/min | Consider burst allowance (e.g., 10 req initial)             |
| RTL breaking links         | CSS not respecting RTL         | Add `direction:rtl` to parent; verify Tailwind RTL plugin   |
| Migrations fail            | Schema conflicts               | Check existing migrations; run `./manage.py showmigrations` |

---

## Resources

- **Feature Spec**: [spec.md](spec.md)
- **Data Model**: [data-model.md](data-model.md)
- **API Contracts**: [contracts/](contracts/)
- **Research Findings**: [research.md](research.md)
- **Django Docs**: https://docs.djangoproject.com/
- **React i18n**: https://react.i18next.com/
- **Tailwind RTL**: https://tailwindcss.com/docs/right-to-left
- **Django Signals**: https://docs.djangoproject.com/en/4.2/topics/signals/

**Questions?** Contact the architecture team or review the full specification.
