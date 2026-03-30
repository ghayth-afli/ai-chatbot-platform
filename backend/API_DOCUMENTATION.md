# API Documentation: Multi-Language Summaries & Language Context

## Summary

This document captures the endpoints introduced/extended for the 005-multilang-summaries feature.

---

## 1. GET /api/ai/users/{user_id}/profile/summary

Retrieve paginated AI-generated summaries for the authenticated user.

### Query Parameters

| Name               | Type   | Description                                              |
| ------------------ | ------ | -------------------------------------------------------- |
| `language_filter`  | string | Optional. `en` or `ar`. Filters summaries by language.   |
| `include_archived` | bool   | Optional. Defaults to `false`. Shows archived summaries. |
| `page`             | int    | Optional. Defaults to 1.                                 |
| `page_size`        | int    | Optional. Defaults to 10, max 100.                       |

### Response (200)

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 12,
      "summary_text": "You frequently ask about deployment pipelines...",
      "language_tag": "en",
      "date_generated": "2026-03-30T14:30:00Z",
      "archived": false,
      "source_session_id": 44,
      "relevance_score": 0.92
    }
  ]
}
```

### Errors

- 401: Authentication required
- 403: User attempting to view another user’s summaries
- 404: User not found

---

## 2. PATCH /api/ai/users/{user_id}/language-preference

Update the authenticated user’s language preference (`en` or `ar`).

### Request Body

```json
{
  "language_preference": "ar"
}
```

### Response (200)

```json
{
  "id": 5,
  "username": "sample",
  "language_preference": "ar",
  "language_preference_updated_at": "2026-03-30T15:05:21.813Z"
}
```

### Validation

- Reject values outside `{ "en", "ar" }`
- 403 if attempting to update another user’s preference

---

## 3. POST /api/chat/{session_id}/send/

Existing endpoint now respects `request.language` and tags all messages with `language_tag`.

### Behavior Changes

- Requests with empty `message` return localized error strings.
- Responses now include `language` field reflecting the tag used.
- Errors from AI providers localize via `LanguageService`.

### Response (200)

```json
{
  "user_message_id": 201,
  "ai_message_id": 202,
  "response": "...",
  "model": "nemotron",
  "language": "ar",
  "tokens_used": 340,
  "session_updated_at": "2026-03-30T15:11:01Z",
  "session_title": "تحسين سير العمل"
}
```

---

## 4. GET /api/chat/history/

Language-filtered chat history with pagination.

### Query Parameters

| Name              | Type   | Description                               |
| ----------------- | ------ | ----------------------------------------- |
| `language_filter` | string | Optional. `en`, `ar`, or `all` (default). |
| `limit`           | int    | Optional. Defaults to 20, max 100.        |
| `offset`          | int    | Optional. Defaults to 0.                  |

### Response (200)

```json
{
  "messages": [
    {
      "id": 90,
      "session_id": 12,
      "session_title": "Market Research",
      "role": "user",
      "content": "...",
      "language_tag": "ar",
      "model": "nemotron",
      "created_at": "2026-03-30T14:00:00Z"
    }
  ],
  "count": 42,
  "limit": 20,
  "offset": 0,
  "language_filter": "ar",
  "language_counts": { "all": 42, "en": 30, "ar": 12 }
}
```

### Errors

- 401: Missing auth
- 400: Invalid `language_filter`

---

## 5. Rate Limiting (Middleware)

Every authenticated request now emits headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1711822501
```

Exceeding the limit returns

```json
{
  "detail": "You have exceeded the rate limit...",
  "retry_after": 43,
  "code": "rate_limit_exceeded"
}
```

Localized strings are returned when `request.language = "ar"`.

---

## 6. Summary Generation (Service/Task)

- `ai/services/summary_service.py` exposes `generate_summary_for_session(session_id)` and `batch_generate_summaries()`.
- Management command `python manage.py generate_summaries` (pending) triggers batch creation.
- Summaries stored in `ai.models.UserSummary` with `language_tag`, `archived`, `relevance_score`.

---

## 7. Testing

- `backend/chats/tests/test_chat_history_api.py` – language filter coverage
- `backend/ai/tests/test_views.py` – summary list pagination/permissions
- `tests/integration/test_us1_view_summaries.py`
- `tests/integration/test_us2_chat_language.py`
- `tests/integration/test_us4_auto_summary.py`
- `tests/security/test_rate_limiting.py`

---

## Notes

- All endpoints require JWT auth.
- Language defaults to `en` if user profile missing.
- Summaries are paginated via DRF PageNumberPagination.
- Rate limit uniform 100 req/min per user as per spec.
