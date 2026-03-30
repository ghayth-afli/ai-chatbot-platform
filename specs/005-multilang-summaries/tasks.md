# Implementation Tasks: Multi-Language User Profiles with AI-Generated Summaries

**Feature**: 005-multilang-summaries  
**Created**: March 30, 2026  
**Branch**: `005-multilang-summaries`  
**Total Tasks**: 45 tasks across 8 phases  
**Estimated Timeline**: 2-3 weeks (15 working days)  
**Team Size**: 2-3 developers (1 backend, 1 frontend, 1 QA/integration)

---

## Phase Overview

| Phase   | Name                                          | Duration   | Tasks     | Status      |
| ------- | --------------------------------------------- | ---------- | --------- | ----------- |
| Phase 1 | Setup & Project Initialization                | Day 1      | T001-T005 | Not Started |
| Phase 2 | Foundational Infrastructure                   | Days 1-3   | T006-T020 | Not Started |
| Phase 3 | User Story 1: View AI Summaries (P1)          | Days 4-5   | T021-T028 | ✅ Complete |
| Phase 4 | User Story 2: Chat in Preferred Language (P1) | Days 5-6   | T029-T036 | Not Started |
| Phase 5 | User Story 3: Rate-Limited API (P2)           | Days 7-8   | T037-T043 | Not Started |
| Phase 6 | User Story 4: Auto Summary Generation (P2)    | Days 8-9   | T044-T050 | Not Started |
| Phase 7 | User Story 5: Language-Filtered History (P3)  | Days 10-11 | T051-T057 | Not Started |
| Phase 8 | Testing, Integration & Deployment             | Days 12-15 | T058-T068 | Not Started |

---

## Dependency Graph

```
Setup (T001-T005)
    ↓
    └─→ Foundational Infrastructure (T006-T020)
            ├─→ Phase 3: US1 - View Summaries (T021-T028) [P1]
            ├─→ Phase 4: US2 - Chat Language (T029-T036) [P1]
            ├─→ Phase 5: US3 - Rate Limiting (T037-T043) [P2]
            ├─→ Phase 6: US4 - Auto Summary (T044-T050) [P2]
            └─→ Phase 7: US5 - Language Filter (T051-T057) [P3]
                    ↓ (all phases complete)
                    └─→ Phase 8: Testing & Deployment (T058-T068)
```

**Parallelization**: After Phase 2 completion, Phases 3-7 can be worked on in parallel by different developers.

---

## Phase 1: Setup & Project Initialization

### Tasks

- [ ] T001 Create and checkout feature branch `005-multilang-summaries`
- [ ] T002 [P] Update backend requirements.txt for new dependencies (if needed): `pip install djangorestframework-simplejwt cachetools`
- [ ] T003 [P] Update frontend package.json for i18next upgrade if needed: `npm install i18next@latest i18next-react@latest`
- [ ] T004 Verify existing database structure in `backend/db.sqlite3` (backup before migrations)
- [ ] T005 Document initial state of User, ChatMessage, ChatSession models in `IMPLEMENTATION_LOG.md`

---

## Phase 2: Foundational Infrastructure (Blocking Prerequisites)

### Backend Database Migrations

- [ ] T006 Create Django migration file: Add `language_preference` field to User model in `backend/ai/models.py`
  - Field: `CharField(max_length=5, choices=[('en', 'English'), ('ar', 'Arabic')], default='en')`
  - Field: `language_preference_updated_at = DateTimeField(auto_now=True, null=True)`
  - File: `backend/ai/migrations/000X_add_language_preference_to_user.py`

- [ ] T007 Create Django migration file: Add `language_tag` to ChatMessage model in `backend/ai/models.py`
  - Field: `CharField(max_length=5, choices=[('en', 'English'), ('ar', 'Arabic')], null=True, blank=True)`
  - Index: `models.Index(fields=['user', 'language_tag', '-created_at'])`
  - File: `backend/ai/migrations/000Y_add_language_tag_to_chatmessage.py`

- [ ] T008 Create Django migration file: Add `language_tag` and `message_count` to ChatSession model in `backend/ai/models.py`
  - Field: `language_tag = CharField(max_length=5, choices=[('en', 'English'), ('ar', 'Arabic')], null=True, blank=True)`
  - Field: `message_count = IntegerField(default=0)`
  - Index: `models.Index(fields=['user', 'language_tag', '-date_created'])`
  - File: `backend/ai/migrations/000Z_add_language_tag_to_chatsession.py`

- [ ] T009 Create Django migration file: Create UserSummary model in `backend/ai/migrations/`
  - File: `backend/ai/migrations/00AA_create_usersummary.py`
  - Should create fresh table with all UserSummary fields (from data-model.md)

- [ ] T010 Run all migrations locally: `cd backend && python manage.py migrate`
  - Verify no errors in SQLite database
  - Log results to `IMPLEMENTATION_LOG.md`

- [ ] T011 [P] Write backfill script: Set all existing users' `language_preference='en'` in `backend/scripts/backfill_language_preference.py`
  - Run: `python backend/scripts/backfill_language_preference.py`
  - Verify: `SELECT COUNT(*) FROM ai_user WHERE language_preference='en'` returns all users

- [ ] T012 [P] Write backfill script: Tag all existing ChatMessages with language_tag='en' in `backend/scripts/backfill_language_tags.py`
  - Query: All ChatMessage records WHERE language_tag IS NULL
  - Set: language_tag='en'
  - Verify: `SELECT COUNT(*) FROM chats_chatmessage WHERE language_tag='en'` returns message count

- [x] T013 Write and run test: Schema validation in `backend/ai/tests/test_models.py`
  - Test: User model has `language_preference` field with correct choices
  - Test: ChatMessage model has `language_tag` field with correct choices
  - Test: ChatSession model has `language_tag` and `message_count` fields
  - Test: UserSummary model exists with all required fields (id, user, summary_text, language_tag, date_generated, archived, source_session_id, relevance_score)
  - Run: `pytest backend/ai/tests/test_models.py -v`

### Backend Middleware Setup

- [ ] T014 Create rate limiter middleware file: `backend/common/middleware/rate_limiter.py`
  - Enforce 100 requests per minute per user_id (sliding window)
  - Use Django cache backend (in-memory for v1)
  - Return 429 status with JSON error response
  - Include X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After headers
  - Localize error message based on request.language (will be set by T015)
  - Key: `rate_limit:{user_id}`

- [ ] T015 Create language context middleware file: `backend/common/middleware/language_context.py`
  - Extract `language_preference` from request.user (if authenticated)
  - Default to 'en' if not found or user not authenticated
  - Attach to request as `request.language`
  - Register in `backend/config/settings.py` MIDDLEWARE list before other custom middleware

- [ ] T016 Register middlewares in `backend/config/settings.py` (MIDDLEWARE list)
  - Add at line {check current middleware order}: `'common.middleware.language_context.LanguageContextMiddleware'`
  - Add after: `'common.middleware.rate_limiter.RateLimiterMiddleware'`

### Backend Service Layer

- [ ] T017 Create summary service file: `backend/ai/services/summary_service.py`
  - Function: `generate_summary_for_session(session_id)` → queries ChatMessage, calls AI API, stores UserSummary
  - Function: `batch_generate_summaries()` → find all sessions with message_count >= 5 and not summary_generated
  - Error handling: Log failures, do NOT block if AI API fails
  - Run (manual trigger): `from ai.services.summary_service import batch_generate_summaries; batch_generate_summaries()`

- [ ] T018 Create language service file: `backend/ai/services/language_service.py`
  - Function: `get_localized_error_message(error_key, language)` → return error string in user's language
  - Function: `validate_language_code(code)` → check if 'en' or 'ar', reject others
  - Function: `get_msa_prompt_instruction()` → return system prompt for formal Arabic
  - File should read i18n JSON files from `backend/i18n/` or use hardcoded dict for v1

- [ ] T019 [P] Create or update serializers in `backend/ai/serializers.py`
  - Add: `UserSummarySerializer` with fields: id, summary_text, language_tag, date_generated, archived
  - Update: `UserSerializer` to include `language_preference` field
  - File: `backend/ai/serializers.py`

- [x] T020 Write unit tests for services in `backend/ai/tests/test_services.py`
  - Test: `validate_language_code('en')` returns True
  - Test: `validate_language_code('ar')` returns True
  - Test: `validate_language_code('ja')` raises ValueError
  - Test: `get_localized_error_message('rate_limit_error', 'ar')` returns Arabic message
  - Run: `pytest backend/ai/tests/test_services.py -v`

---

## Phase 3: User Story 1 - View User Profile with AI Summaries (P1)

### Backend: Profile Summary API

- [x] T021 [P] [US1] Extend `backend/ai/views.py` to add GET profile summary endpoint
  - Endpoint: `GET /api/users/{user_id}/profile/summary`
  - Query: `UserSummary.objects.filter(user_id=user_id, archived=False).order_by('-date_generated')`
  - Response: Paginated list with fields: id, summary_text, language_tag, date_generated, archived
  - Authentication: Require JWT token; user can only view own summaries or admin override
  - Status: 200 on success; 401 if not authenticated; 404 if user not found
  - File: `backend/ai/views.py` (add ProfileSummaryListView class)

- [x] T022 [P] [US1] Add endpoint URL routing in `backend/ai/urls.py`
  - Route: `path('api/users/<int:user_id>/profile/summary', ProfileSummaryListView.as_view())`
  - Include in `backend/config/urls.py` as `path('', include('ai.urls'))`

- [x] T023 [US1] Create unit test for profile summary endpoint in `backend/ai/tests/test_views.py`
  - Test: GET returns 200 and paginated list
  - Test: GET returns only active (archived=False) summaries
  - Test: GET returns summaries in reverse chronological order
  - Test: GET returns 401 if not authenticated
  - Test: GET returns empty list if user has no summaries
  - Run: `pytest backend/ai/tests/test_views.py::test_profile_summary -v`

### Frontend: Profile Summary Component

- [x] T024 [P] [US1] Create React component: `frontend/src/components/ProfileSummary/ProfileSummary.tsx`
  - Component receives user_id as prop or from context
  - Fetch data from GET `/api/users/{user_id}/profile/summary`
  - Display summaries in list (newest first)
  - Handle loading state: Show spinner
  - Handle error state: Show error message from i18n
  - Handle empty state: Show "No summaries yet" message from i18n
  - Use `useUserSummaries()` hook (to be created in T025)
  - CSS: `frontend/src/components/ProfileSummary/ProfileSummary.css` (or Tailwind classes)

- [x] T025 [P] [US1] Create React hook: `frontend/src/hooks/useUserSummaries.ts`
  - Hook: `useUserSummaries(user_id)` returns { summaries, loading, error }
  - Fetch: `GET /api/users/{user_id}/profile/summary`
  - Caching: Optional 5-minute TTL caching using React Query or manual state
  - Pagination: Handle limit/offset if backend returns paginated results

- [x] T026 [P] [US1] Create SummaryCard component: `frontend/src/components/ProfileSummary/SummaryCard.tsx`
  - Props: summary object with { id, summary_text, language_tag, date_generated, archived }
  - Display: summary_text, language_tag badge (en/ar flag), date_generated formatted
  - Button: Archive button with onClick handler (to be wired in T043)
  - CSS: Inline or Tailwind classes

- [x] T027 [US1] Add i18n translations for profile summary
  - File additions to `frontend/src/i18n/en.json`:
    ```json
    {
      "profile": {
        "summary_title": "Your Interaction Summary",
        "summary_subtitle": "Quick insights into your chat patterns",
        "no_summaries": "No summaries available yet. Start chatting to see your interaction patterns!",
        "language_en": "English",
        "language_ar": "Arabic"
      },
      "common": {
        "loading": "Loading...",
        "error": "Something went wrong"
      },
      "error": {
        "fetchSummaries": "Failed to load summaries. Please try again."
      }
    }
    ```
  - File additions to `frontend/src/i18n/ar.json`:
    ```json
    {
      "profile": {
        "summary_title": "ملخص تفاعلاتك",
        "summary_subtitle": "رؤى شاملة عن أنماط محادثتك",
        "no_summaries": "لا توجد ملخصات متاحة حالياً. ابدأ بالدردشة لرؤية أنماط التفاعل الخاصة بك!",
        "language_en": "English",
        "language_ar": "العربية"
      },
      "common": {
        "loading": "جارٍ التحميل...",
        "error": "حدث خطأ ما"
      },
      "error": {
        "fetchSummaries": "فشل تحميل الملخصات. يرجى المحاولة مرة أخرى."
      }
    }
    ```

- [x] T028 [US1] Integrate ProfileSummary component into profile page: `frontend/src/features/profile/ProfilePage.tsx`
  - Add import: `import ProfileSummary from '@/components/ProfileSummary/ProfileSummary'`
  - Add component to JSX: `<ProfileSummary user_id={currentUser.id} />`
  - Section should appear after user info, before other sections
  - Test: Component renders without errors

---

## Phase 4: User Story 2 - Chat in Preferred Language (P1)

### Backend: Language Context in Chat

- [ ] T029 [P] [US2] Extend POST `/api/chat/send` endpoint in `backend/ai/views.py`
  - Modify: Get language_tag from request.language (set by language_context middleware)
  - On ChatMessage creation: Automatically set `language_tag = request.language`
  - On ChatSession creation: Automatically set `language_tag = user.language_preference`
  - Response: Include `language_tag` field in response JSON
  - AI prompt: Pass language context to AI service (will be handled in summary_service.py)
  - File: `backend/ai/views.py` (modify ChatSendView or similar)

- [ ] T030 [P] [US2] Create language preference setter endpoint in `backend/ai/views.py`
  - Endpoint: `PATCH /api/users/{user_id}/language-preference`
  - Body: `{ "language_preference": "ar" }`
  - Validate: Only accept 'en' or 'ar'
  - Update: User.language_preference field
  - Update: User.language_preference_updated_at field
  - Response: 200 with updated user object
  - Authentication: User can only update own preference
  - File: `backend/ai/views.py` (add LanguagePreferenceUpdateView class)

- [ ] T031 [US2] Add endpoint URLs in `backend/ai/urls.py`
  - Route: `path('api/users/<int:user_id>/language-preference', LanguagePreferenceUpdateView.as_view())`

- [ ] T032 [US2] Create localized error messages in `backend/ai/services/language_service.py`
  - Error: 'invalid_language': "Language not supported" (English), "اللغة غير مدعومة" (Arabic)
  - Error: 'chat_error': "Failed to process your message" (English), "فشل معالجة رسالتك" (Arabic)
  - Error: 'session_error': "Failed to create chat session" (English), "فشل إنشاء جلسة الدردشة" (Arabic)
  - Function: Hardcode errors as dict OR read from JSON files in backend/i18n/

- [ ] T033 [P] [US2] Update error responses in POST `/api/chat/send` to use localized messages
  - Catch exceptions; determine user.language_preference
  - Return error message in user's language
  - Example: User with language_preference='ar' receives Arabic error message
  - File: `backend/ai/views.py` (modify ChatSendView error handling)

### Frontend: Language Selection & Chat Interface

- [ ] T034 [P] [US2] Create language preference hook: `frontend/src/hooks/useLanguagePreference.ts`
  - Hook: `useLanguagePreference()` returns { language, setLanguage, loading, error }
  - Get: From user context or localStorage initially
  - Set: Call `PATCH /api/users/{user_id}/language-preference` on change
  - Side effect: Change i18next language with `i18n.changeLanguage(language)`
  - Side effect: Set `html.dir = language === 'ar' ? 'rtl' : 'ltr'`

- [ ] T035 [P] [US2] Extend LanguageSelector component: `frontend/src/features/profile/LanguageSelector.tsx`
  - Component: Dropdown with options: English, العربية
  - On change: Call `setLanguage()` from useLanguagePreference hook
  - Display: Currently selected language
  - Location: Profile page header or settings section

- [ ] T036 [US2] Test language switching in `frontend/tests/LanguageSwitching.test.tsx`
  - Test: Switch from English to Arabic
  - Test: UI text changes to Arabic
  - Test: dir="rtl" applied to HTML
  - Test: API call sent to PATCH endpoint
  - Test: Language persists on page reload (localStorage)

---

## Phase 5: User Story 3 - Rate-Limited API Requests (P2)

### Backend: Rate Limit Enforcement

- [ ] T037 [P] [US3] Complete rate limiter middleware in `backend/common/middleware/rate_limiter.py`
  - Limit: 100 requests per minute per user_id
  - Window: Sliding 60-second window
  - Counter storage: Django cache (in-memory cache.set/cache.get)
  - Cache key: `rate_limit:{user_id}:timestamp` with expiry=60 seconds
  - Response on limit exceeded: JSON error with fields: { detail, retry_after }
  - Status code: 429 (Too Many Requests)
  - Headers: X-RateLimit-Limit: 100, X-RateLimit-Remaining: N, Retry-After: 60
  - Localization: Error message in request.language (set by language_context middleware)

- [ ] T038 [P] [US3] Add rate limit error localization in `backend/ai/services/language_service.py`
  - Key 'rate_limit_error':
    - English: "You have exceeded the rate limit. Maximum 100 requests per minute allowed. Please try again in {retry_after} seconds."
    - Arabic: "لقد تجاوزت حد معدل الطلب. يُسمح بحد أقصى 100 طلب في الدقيقة. يرجى المحاولة مرة أخرى خلال {retry_after} ثانية."

- [ ] T039 [US3] Create unit tests for rate limiter in `backend/common/tests/test_rate_limiter.py`
  - Test: First 100 requests succeed (status 200)
  - Test: Request 101 returns 429
  - Test: After 60 seconds, counter resets and request succeeds
  - Test: Different users have separate counters
  - Test: Non-authenticated requests bypass rate limiter (or use special key?)
  - Run: `pytest backend/common/tests/test_rate_limiter.py -v`

### Frontend: Rate Limit Error Handling

- [ ] T040 [P] [US3] Add rate limit error handling in chat service: `frontend/src/services/chatService.ts`
  - On 429 response: Extract retry_after from response header or body
  - Display: Error message from i18n with retry time
  - Button: Show "Try again in {retry_after}s" (countdown timer)
  - Disable: Disable chat input during cooldown period

- [ ] T041 [US3] Add rate limit error i18n keys
  - File `frontend/src/i18n/en.json`:
    ```json
    {
      "error": {
        "rate_limit": "You've sent too many messages. Please wait {seconds} seconds before trying again.",
        "rate_limit_short": "Rate limited. Try again in {seconds}s."
      }
    }
    ```
  - File `frontend/src/i18n/ar.json`:
    ```json
    {
      "error": {
        "rate_limit": "لقد أرسلت الكثير من الرسائل. يرجى الانتظار {seconds} ثانية قبل المحاولة مرة أخرى.",
        "rate_limit_short": "حد معدل. حاول مرة أخرى في {seconds}ث."
      }
    }
    ```

- [ ] T042 [US3] Create rate limit error component: `frontend/src/components/RateLimitError.tsx`
  - Props: { retryAfter: number }
  - Display: Countdown timer "Try again in {seconds}s"
  - Update: Decrement every second until 0
  - Button: "Retry" button enabled when counter reaches 0

- [ ] T043 [US3] Test rate limit UI in `frontend/tests/e2e/RateLimiting.e2e.ts` (Playwright)
  - Test: Send 100+ rapid requests (bash loop)
  - Test: UI shows rate limit error
  - Test: Countdown timer appears and counts down
  - Test: After cooldown, chat input re-enabled

---

## Phase 6: User Story 4 - Automatic Summary Generation (P2)

### Backend: Summary Generation Service

- [ ] T044 [P] [US4] Implement summary generation function in `backend/ai/services/summary_service.py`
  - Function: `generate_summary_for_session(session_id: int) -> UserSummary`
  - Query: Get all ChatMessages for session (order by created_at)
  - Format: Create prompt with message history
  - Add MSA instruction to prompt if session.language_tag == 'ar'
  - Call: Existing AI API (OpenRouter/Groq via Django backend)
  - Store: Create UserSummary model instance:
    - user = session.user
    - summary_text = AI response truncated to 2000 chars
    - language_tag = session.language_tag
    - source_session_id = session.id
    - date_generated = now
    - archived = False
  - Error handling: If AI call fails, log error, do NOT raise exception, skip summary

- [ ] T045 [P] [US4] Implement batch summary generation function in `backend/ai/services/summary_service.py`
  - Function: `batch_generate_summaries() -> List[UserSummary]`
  - Query: Find all ChatSession records where message_count >= 5 AND (no UserSummary exists OR flag summary_generated=False)
  - Loop: Call `generate_summary_for_session()` for each qualifying session
  - Concurrency: Option to use ThreadPoolExecutor to parallelize (optional for v1)
  - Return: List of created UserSummary objects

- [ ] T046 [US4] Create async task trigger in `backend/ai/tasks.py` (Celery or APScheduler)
  - Task: `summarize_completed_sessions()` calls `batch_generate_summaries()`
  - Trigger: On ChatMessage creation, if session.message_count reaches 5
  - OR: Periodic task every 1 minute via Celery beat
  - OR: Manual trigger via management command

- [ ] T047 [US4] Create Django signal to increment message_count in `backend/ai/signals.py`
  - Signal: `post_save` on ChatMessage
  - Action: Increment session.message_count += 1
  - Action: If message_count == 5, trigger summary generation task
  - File: `backend/ai/signals.py`
  - Register: In `backend/ai/apps.py` AppConfig.ready() method

- [ ] T048 [US4] Create management command for manual summary trigger: `backend/ai/management/commands/generate_summaries.py`
  - Command: `python manage.py generate_summaries`
  - Action: Call `batch_generate_summaries()`
  - Output: Print count of summaries generated
  - Usage: For manual testing and backfilling

- [ ] T049 [US4] Create unit tests for summary generation in `backend/ai/tests/test_summary_generation.py`
  - Test: `generate_summary_for_session()` with 5+ messages creates UserSummary
  - Test: UserSummary.language_tag matches session.language_tag
  - Test: UserSummary.summary_text is not empty and <= 2000 chars
  - Test: If AI fails, log error but don't raise exception
  - Test: `batch_generate_summaries()` finds all sessions with message_count >= 5
  - Run: `pytest backend/ai/tests/test_summary_generation.py -v`

- [ ] T050 [US4] Create end-to-end test for summary generation in `tests/integration/test_multilang_user_profile.py`
  - Test scenario: User sends 5 messages → signal triggers → batch job runs → UserSummary appears → GET profile returns summary
  - Verify: Summary text is in correct language (English or Arabic based on session.language_tag)
  - File: `tests/integration/test_multilang_user_profile.py`

---

## Phase 7: User Story 5 - Language-Specific Chat History (P3)

### Backend: Language-Filtered History Endpoint

- [ ] T051 [P] [US5] Extend GET `/api/chat/history` endpoint in `backend/ai/views.py` (or create new endpoint)
  - Endpoint: `GET /api/chat/history?language_filter=ar` (optional query param)
  - Query default: Return all messages for user
  - Query with filter: `ChatMessage.objects.filter(user=user, language_tag='ar').order_by('-created_at')`
  - Response: JSON list of messages with fields: { id, content, language_tag, created_at, role }
  - Pagination: Support limit/offset query params
  - File: `backend/ai/views.py` (modify or create ChatHistoryListView)

- [ ] T052 [US5] Update endpoint URL in `backend/ai/urls.py`
  - Route: `path('api/chat/history', ChatHistoryListView.as_view())`

- [ ] T053 [US5] Create unit tests for chat history endpoint in `backend/ai/tests/test_views.py`
  - Test: GET returns all messages (unfiltered)
  - Test: GET with ?language_filter=en returns only English messages
  - Test: GET with ?language_filter=ar returns only Arabic messages
  - Test: Results ordered by -created_at (newest first)
  - Test: Pagination works with limit/offset
  - Run: `pytest backend/ai/tests/test_views.py::test_chat_history -v`

### Frontend: Language Filter UI

- [ ] T054 [P] [US5] Create language filter hook: `frontend/src/hooks/useLanguageFilter.ts`
  - Hook: `useLanguageFilter()` returns { messages, language, setLanguage, loading }
  - Fetch: `GET /api/chat/history?language_filter={language}` when language changes
  - Initial: language = null (show all)
  - Options: null (all), 'en', 'ar'

- [ ] T055 [P] [US5] Create language filter UI component: `frontend/src/components/ChatHistory/LanguageFilterTabs.tsx`
  - Tabs: "All Conversations", "English", "العربية"
  - On click: Update language filter
  - Display: Message count per language
  - Location: Above chat history list

- [ ] T056 [US5] Integrate filter into ChatHistory component: `frontend/src/features/chat/ChatHistoryPanel.tsx`
  - Add LanguageFilterTabs above history list
  - Wire setLanguage to hook
  - Pass filtered messages to display
  - Update: When language changes, re-fetch from API

- [ ] T057 [US5] Add i18n keys for language filter
  - File `frontend/src/i18n/en.json`:
    ```json
    {
      "chat": {
        "history_all": "All Conversations",
        "history_en": "English",
        "history_ar": "Arabic",
        "history_count": "{count} conversations"
      }
    }
    ```
  - File `frontend/src/i18n/ar.json`:
    ```json
    {
      "chat": {
        "history_all": "جميع المحادثات",
        "history_en": "English",
        "history_ar": "العربية",
        "history_count": "{count} محادثة"
      }
    }
    ```

---

## Phase 8: Testing, Integration & Deployment

### Integration Testing

- [ ] T058 [P] Create end-to-end test: User Story 1 flow in `tests/integration/test_us1_view_summaries.py`
  - Flow: User logs in → navigates to profile → AI summaries displayed in preferred language
  - Verify: Summary text is in correct language (en or ar)
  - Verify: Multiple summaries displayed in reverse chronological order
  - Verify: Archive button present and functional

- [ ] T059 [P] Create end-to-end test: User Story 2 flow in `tests/integration/test_us2_chat_language.py`
  - Flow: User sets Arabic preference → sends message → receives response → sees Arabic UI
  - Verify: Message tagged with language_tag='ar'
  - Verify: Error messages in Arabic
  - Verify: i18n keys resolved to Arabic strings

- [ ] T060 [P] Create security test: Rate limiting in `tests/security/test_rate_limiting.py`
  - Test: Rapid request loop (101+ requests in 60 seconds)
  - Verify: Requests 1-100 succeed (200)
  - Verify: Request 101+ return 429
  - Verify: Different users have independent limits

- [ ] T061 Create end-to-end test: User Story 4 flow in `tests/integration/test_us4_auto_summary.py`
  - Flow: User sends 5 messages → system generates summary → appears on profile
  - Verify: UserSummary created after message_count reaches 5
  - Verify: Summary language matches session language
  - Wait: Accommodate async task delay (1-2 minutes for batch job)

- [ ] T062 Create load test: Performance validation in `tests/performance/test_load.py`
  - Load: Simulate 100 concurrent users
  - Endpoints: GET profile summaries, POST chat/send, GET chat/history
  - Verify: Response time <2 seconds for summary display
  - Verify: Response time <500ms for rate limit check
  - Tool: Apache Bench (ab) or Locust

### Documentation & Deployment

- [ ] T063 [P] Write deployment documentation: `DEPLOYMENT_GUIDE.md`
  - Steps: Database migrations on production
  - Steps: Enable middleware in settings.py
  - Config: CACHE backend must be configured (Redis or in-memory)
  - Config: Async task worker must be running (Celery or APScheduler)
  - Steps: Load i18n translations (Arabic native review)
  - Rollback: Plan for rolling back migrations if needed

- [ ] T064 Update API documentation: `backend/API_DOCUMENTATION.md` (or OpenAPI/Swagger)
  - New endpoints: GET /api/users/{user_id}/profile/summary
  - New endpoints: PATCH /api/users/{user_id}/language-preference
  - New endpoints: GET /api/chat/history?language_filter=
  - Updated endpoints: POST /api/chat/send (now includes language_tag in response)
  - Rate limit: 100 req/min per user documented

- [ ] T065 Update frontend README: `frontend/README.md`
  - i18n: How to add new translation keys
  - Components: ProfileSummary, SummaryCard, LanguageSelector usage
  - RTL: How RTL rendering works for Arabic

- [ ] T066 [P] Create implementation checklist: `IMPLEMENTATION_CHECKLIST.md`
  - Checkbox: All migrations applied
  - Checkbox: All services tested
  - Checkbox: All endpoints tested
  - Checkbox: Frontend components rendered
  - Checkbox: i18n keys complete
  - Checkbox: Rate limiter tested
  - Checkbox: Summary generation working
  - Checkbox: Language filter working
  - Checkbox: E2E tests pass
  - Checkbox: Security tests pass
  - Checkbox: Load tests pass
  - Checkbox: Documentation updated
  - Checkbox: Deployment prepared

- [ ] T067 Final QA: Test all user stories end-to-end
  - US1: View AI summaries → navigate to profile → see summaries in language
  - US2: Chat in language → send message → receive response in language
  - US3: Exceed rate limit → see 429 error in language
  - US4: Send 5 messages → auto summary generated → appears on profile
  - US5: Filter history by language → see only messages in selected language

- [ ] T068 Deploy to staging: `git push origin 005-multilang-summaries`
  - PR review: Code review for all changes
  - Merge: Merge to main branch (or staging)
  - Deploy: Run deployment checklist (T063)
  - Verify: Test all functionality on staging environment
  - Production: Deploy to production with monitoring enabled

---

## Parallel Execution Strategy

### Independent Work Streams (After Phase 2)

**Developer 1 (Backend)**: Can start Phase 6 (summary generation) after Phase 2 completes

- T044-T050: Summary service implementation (independent of frontend)
- Should NOT wait for Phases 3-5

**Developer 2 (Frontend)**: Can start Phases 3, 4, 5 after Phase 2 completes

- T024-T028: ProfileSummary component (Phase 3)
- T034-T036: Language switching (Phase 4)
- T040-T043: Rate limit UI (Phase 5)
- Can work on all three in parallel

**Developer 3 (QA)**: Can start integration testing after Phase 2

- T058-T062: Integration and security testing
- Wait for T044-T050 completion before full end-to-end testing

### Synchronization Points

1. **After T020**: Phase 2 complete → all teams can proceed in parallel
2. **After T050**: Phase 6 complete → enable full end-to-end testing
3. **After T067**: All user stories tested → ready for deployment

---

## Success Criteria per Phase

| Phase   | Success Criteria                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------- |
| Phase 2 | All migrations apply without errors; all unit tests pass; no data loss                                                 |
| Phase 3 | ProfileSummary component renders; summaries appear in correct language; archived/unarchived toggling works             |
| Phase 4 | Language selector works; chat responses in selected language; error messages localized; RTL rendering correct          |
| Phase 5 | Rate limiter returns 429 after 100 requests; error message localized; frontend shows countdown timer                   |
| Phase 6 | UserSummary auto-generated after 5 messages; appears on profile within 2 minutes; language tagged correctly            |
| Phase 7 | Language filter shows only filtered messages; tabs display correct counts; filtering works for both languages          |
| Phase 8 | All E2E tests pass; security tests pass; load tests meet latency targets; documentation complete; ready for production |

---

## Notes for Cost-Effective LLM Execution

1. **Task Independence**: Each task can be assigned to a LLM in isolation with full context; no task requires knowledge of other tasks
2. **Exact File Paths**: Every file path is absolute or relative from project root; no ambiguity
3. **Clear Success Criteria**: Each task has explicit pass/fail conditions; no subjective outcomes
4. **No Hidden Dependencies**: All dependencies listed explicitly in task or dependency graph
5. **Reproducible**: All commands and code examples provided; no "figure it out" instructions
6. **Error Messaging**: All error messages provided in English and Arabic; no external translation needed
7. **Testing**: All test patterns and assertions provided; LLM can write tests by example
8. **Documentation**: All naming conventions, file structure, and patterns documented for consistency

---

## Task Completion Tracking

Print this table and mark as tasks complete:

```
T001: [ ]; T002: [ ]; T003: [ ]; T004: [ ]; T005: [ ];
T006: [ ]; T007: [ ]; T008: [ ]; T009: [ ]; T010: [ ];
T011: [ ]; T012: [ ]; T013: [ ]; T014: [ ]; T015: [ ];
T016: [ ]; T017: [ ]; T018: [ ]; T019: [ ]; T020: [ ];
T021: [ ]; T022: [ ]; T023: [ ]; T024: [ ]; T025: [ ];
T026: [ ]; T027: [ ]; T028: [ ]; T029: [ ]; T030: [ ];
T031: [ ]; T032: [ ]; T033: [ ]; T034: [ ]; T035: [ ];
T036: [ ]; T037: [ ]; T038: [ ]; T039: [ ]; T040: [ ];
T041: [ ]; T042: [ ]; T043: [ ]; T044: [ ]; T045: [ ];
T046: [ ]; T047: [ ]; T048: [ ]; T049: [ ]; T050: [ ];
T051: [ ]; T052: [ ]; T053: [ ]; T054: [ ]; T055: [ ];
T056: [ ]; T057: [ ]; T058: [ ]; T059: [ ]; T060: [ ];
T061: [ ]; T062: [ ]; T063: [ ]; T064: [ ]; T065: [ ];
T066: [ ]; T067: [ ]; T068: [ ];
```

---

**Generated**: March 30, 2026  
**Status**: Ready for implementation  
**Next Step**: Assign tasks to developers; begin Phase 1 & 2 in parallel
