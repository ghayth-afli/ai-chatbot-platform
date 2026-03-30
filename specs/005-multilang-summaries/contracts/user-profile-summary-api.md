# API Contract: User Profile Summary Endpoint

**Feature**: Multi-Language User Profiles with AI-Generated Summaries  
**Version**: 1.0  
**Date**: March 30, 2026  
**Stability**: Draft (finalized in implementation phase)

## Endpoint: GET /api/users/{user_id}/profile/summary

### Purpose

Retrieve AI-generated summaries of a user's chat interactions, displayed in the user's preferred language. Summaries are archived by the user as needed.

### Request

**Method**: `GET`  
**Path**: `/api/users/{user_id}/profile/summary`  
**Authentication**: Required (JWT token; user_id must match token subject)

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `language_filter` | string | No | None | Filter summaries by language (`'en'` or `'ar'`); if omitted, return all active summaries |
| `include_archived` | boolean | No | false | Include archived summaries in response |
| `limit` | integer | No | 20 | Maximum summaries to return |
| `offset` | integer | No | 0 | Pagination offset |

**Example Request**:

```bash
GET /api/users/123/profile/summary?language_filter=ar&include_archived=false&limit=10
Authorization: Bearer {JWT_TOKEN}
```

### Response

**Status Code**: `200 OK`

**Response Body** (JSON):

```json
{
  "user_id": 123,
  "language_preference": "ar",
  "summaries": [
    {
      "id": "sum-001",
      "text": "أنت تسأل بشكل متكرر عن مفاهيم الترميز واتجاهات الذكاء الاصطناعي",
      "language_tag": "ar",
      "date_generated": "2026-03-30T14:30:00Z",
      "source_session_id": "sess-042",
      "relevance_score": 0.95,
      "archived": false
    },
    {
      "id": "sum-002",
      "text": "You frequently discuss web development frameworks and deployment strategies",
      "language_tag": "en",
      "date_generated": "2026-03-29T10:15:00Z",
      "source_session_id": "sess-041",
      "relevance_score": 0.88,
      "archived": false
    }
  ],
  "count": 2,
  "next": null,
  "previous": null
}
```

**Schema Details**:

- `summaries`: Array of summary objects (sorted by date_generated DESC)
- `language_tag`: ISO 639-1 code (`'en'` or `'ar'`)
- `text`: Summary text in the specified language (max 2000 characters)
- `relevance_score`: Float [0.0, 1.0] indicating confidence
- `archived`: Boolean; if true, summary is hidden but not deleted
- `count`: Total number of summaries (excluding pagination)

### Error Responses

**401 Unauthorized** - Missing or invalid JWT token

```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden** - Attempting to access another user's summaries

```json
{
  "detail": "You do not have permission to access this user's profile."
}
```

**404 Not Found** - User does not exist

```json
{
  "detail": "User not found."
}
```

**400 Bad Request** - Invalid query parameter

```json
{
  "detail": "Invalid language_filter. Supported values: 'en', 'ar'."
}
```

### Localization

**For Arabic users** (`user.language_preference == 'ar'`):

- Error messages returned in Arabic
- All string fields use Formal Modern Standard Arabic (MSA)
- Date/time formatted per user locale preference

**For English users**:

- Error messages in English
- All string fields in clear, concise English

---

## Endpoint: POST /api/users/{user_id}/profile/summary/{summary_id}/archive

### Purpose

Archive (hide) a user summary without deleting it. Archived summaries are excluded from the default profile view but remain accessible for audit/export.

### Request

**Method**: `POST`  
**Path**: `/api/users/{user_id}/profile/summary/{summary_id}/archive`  
**Authentication**: Required (JWT token; user_id must match token subject)

**Request Body**: Empty (no payload required)

```bash
POST /api/users/123/profile/summary/sum-001/archive
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Response

**Status Code**: `200 OK`

**Response Body**:

```json
{
  "id": "sum-001",
  "text": "أنت تسأل بشكل متكرر عن مفاهيم الترميز...",
  "language_tag": "ar",
  "date_generated": "2026-03-30T14:30:00Z",
  "archived": true
}
```

### Error Responses

**401 Unauthorized** - Missing or invalid JWT token  
**403 Forbidden** - User attempting to archive another user's summary  
**404 Not Found** - Summary does not exist

---

## Endpoint: DELETE /api/users/{user_id}/profile/summary/{summary_id}/archive

### Purpose

Restore (unarchive) a previously archived summary. Makes it visible on profile again.

### Request

**Method**: `DELETE`  
**Path**: `/api/users/{user_id}/profile/summary/{summary_id}/archive`  
**Authentication**: Required

### Response

**Status Code**: `200 OK`

```json
{
  "id": "sum-001",
  "archived": false
}
```

---

## Data Contract: UserSummary Object

```typescript
interface UserSummary {
  id: string; // Unique identifier (e.g., "sum-001")
  user_id: number; // Owner's user ID
  text: string; // Summary text in specified language (max 2000 chars)
  language_tag: "en" | "ar"; // ISO 639-1 language code
  date_generated: ISO8601; // Timestamp when summary was created
  source_session_id: string; // Reference to ChatSession that contributed summary
  relevance_score: number; // Confidence [0.0, 1.0]
  archived: boolean; // Whether summary is hidden from default view
}
```

---

## Performance SLAa

| Metric                      | Target                     | Recovery                    |
| --------------------------- | -------------------------- | --------------------------- |
| GET summaries response time | <2 seconds p99             | Cache with 5-min TTL        |
| Archive/unarchive latency   | <500ms p99                 | Standard DB index           |
| Data consistency            | Eventual (eventual=<5 sec) | Cache invalidation on write |

---

## Rate Limiting

This endpoint is subject to the platform's uniform rate limit: **100 requests per minute per user**.

If exceeded, server returns:

**429 Too Many Requests**

```json
{
  "detail": "Request rate limit exceeded: 100 requests per minute. Please retry after 60 seconds.",
  "retry_after": 60
}
```

For Arabic users, the message is localized in MSA:

```json
{
  "detail": "تم تجاوز حد معدل الطلب: 100 طلب في الدقيقة. يرجى إعادة المحاولة بعد 60 ثانية.",
  "retry_after": 60
}
```

---

## Backward Compatibility

- **v0 → v1**: New endpoint; no changes to existing endpoints
- **Breaking changes**: None
- **Deprecation**: None
- **Migration**: Optional feature; users without language_preference default to English (existing behavior)

---

## Testing Checklist

- [ ] GET /profile/summary returns empty array for user with no summaries
- [ ] GET /profile/summary for Arabic user returns MSA text with RTL characters preserved
- [ ] language_filter parameter correctly filters results
- [ ] include_archived parameter controls archive visibility
- [ ] Archive/unarchive modify only targeted summary, not others
- [ ] 401/403/404 errors return localized messages per user language
- [ ] Rate limit enforcement returns 429 with localized retry message
- [ ] Pagination works correctly (offset/limit)
- [ ] Concurrent requests don't cause race conditions
