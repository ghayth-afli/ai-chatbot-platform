# Data Model: Multi-Language User Profiles with AI-Generated Summaries

**Date**: March 30, 2026  
**Feature**: 005-multilang-summaries  
**Phase**: Phase 1 - Design & Data Model

## Overview

This feature extends the existing user profile database schema with language preference tracking, language-tagged chat history, and AI-generated user summaries. No new foundational models required; existing User and Chat models are extended.

## Entity Definitions

### 1. User (Extended)

**Existing Model**: `ai.models.User` (or similar)  
**Extensions**: Add language preference fields

| Field                            | Type                    | Constraints                              | Description                               |
| -------------------------------- | ----------------------- | ---------------------------------------- | ----------------------------------------- |
| `language_preference`            | CharField(max_length=5) | choices: `['en', 'ar']`; default: `'en'` | User's selected language code (ISO 639-1) |
| `language_preference_updated_at` | DateTimeField           | auto_now=True                            | Timestamp of last preference change       |

**Validation Rules**:

- Only accepts ISO 639-1 codes `'en'` or `'ar'`; reject other values with localized error message
- Default to `'en'` for backward compatibility with existing users
- Allow users to change preference at any time

**Relationships**:

- One-to-Many with `UserSummary` (one user → many summaries)
- Existing relationship with `Chat` remains unchanged

**Notes**:

- Existing JWT token can include `language_preference` as claim for fast lookup
- Prefix all user-facing UI strings with `i18n.t('profile.language_preference')` from i18n framework

---

### 2. Chat Message (Extended)

**Existing Model**: `chats.models.ChatMessage` (or similar)  
**Extensions**: Add language tagging

| Field          | Type                    | Constraints                                      | Description                                |
| -------------- | ----------------------- | ------------------------------------------------ | ------------------------------------------ |
| `language_tag` | CharField(max_length=5) | choices: `['en', 'ar']`; null=True, default=None | ISO 639-1 language code of message content |

**Validation Rules**:

- Populated automatically from `user.language_preference` at message creation time
- Not editable after creation (messages inherit language from session context)
- May be `NULL` for legacy messages created before feature deployment (backfill during migration)

**Migration Strategy**:

- Add column as nullable; default `None`
- Run backfill script: messages from users with `language_preference='ar'` tagged `'ar'`; all others tagged `'en'`
- Make non-nullable in v1.1 (after 1-release stabilization)

**Indexing**:

- Add composite index on `(user_id, language_tag, created_at)` for efficient language-filtered queries

**Notes**:

- Purpose: Enable "Show only Arabic conversations" filtering on frontend
- No validation of actual content (AI may respond in different language regardless); system trusts user preference

---

### 3. Chat Session (Extended)

**Existing Model**: `chats.models.ChatSession` (or similar)  
**Extensions**: Add language tracking and message count

| Field           | Type                    | Constraints                                      | Description                                                                   |
| --------------- | ----------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `language_tag`  | CharField(max_length=5) | choices: `['en', 'ar']`; null=True, default=None | Primary language of session (from user preference at session creation)        |
| `message_count` | IntegerField            | default=0; auto-increment on each message        | Total messages in session (used to trigger summary generation at 5+ messages) |

**Validation Rules**:

- `language_tag` populated from `user.language_preference` at session creation; not editable
- `message_count` incremented automatically by middleware/signal on each ChatMessage creation
- Sessions with fewer than 5 messages do NOT trigger summary generation

**Migration Strategy**:

- Add columns; backfill `language_tag` from user preference; count existing messages for `message_count`

**Notes**:

- Triggers are `message_count >= 5` AND session not yet summarized

---

### 4. User Summary (NEW MODEL)

**Model Name**: `UserSummary`  
**Location**: `ai.models.UserSummary`

| Field               | Type                               | Constraints                       | Description                                                  |
| ------------------- | ---------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| `id`                | AutoField                          | Primary Key                       | Unique identifier                                            |
| `user`              | ForeignKey(User)                   | on_delete=CASCADE                 | Owner of the summary                                         |
| `summary_text`      | TextField                          | max_length=2000                   | AI-generated summary of interaction patterns                 |
| `language_tag`      | CharField(max_length=5)            | choices: `['en', 'ar']`; required | Language of summary text                                     |
| `date_generated`    | DateTimeField                      | auto_now_add=True                 | When summary was created                                     |
| `source_session_id` | ForeignKey(ChatSession, null=True) | on_delete=SET_NULL                | Session(s) that contributed to this summary                  |
| `relevance_score`   | FloatField                         | default=1.0; range [0.0, 1.0]     | Confidence/relevance of summary (for future ML ranking)      |
| `archived`          | BooleanField                       | default=False                     | User-initiated archive flag (summary hidden but not deleted) |

**Indexes**:

- Primary: `(user_id, archived, date_generated DESC)` — for "show active summaries, newest first"
- Secondary: `(user_id, language_tag, archived)` — for language filtering
- Composite: `(source_session_id)` — for referential integrity checks

**Relationships**:

- Many-to-One: UserSummary → User
- One-to-One/Many: UserSummary → ChatSession (may reference one session or aggregated from multiple)

**Query Patterns**:

```python
# Display all active summaries for user, newest first
active = UserSummary.objects.filter(user=user, archived=False).order_by('-date_generated')

# Archive a summary (soft delete)
summary.archived = True
summary.save()

# Show only Arabic summaries
ar_summaries = UserSummary.objects.filter(user=user, language_tag='ar', archived=False)

# Bulk operations: mark old summaries (>6 months) as archived
from django.utils import timezone
from datetime import timedelta
old_date = timezone.now() - timedelta(days=180)
UserSummary.objects.filter(date_generated__lt=old_date, archived=False).update(archived=True)
```

**Notes**:

- Summaries are immutable after creation (no edit API)
- Archive is soft-delete (data preserved for audit/export)
- No hard delete in v1 (supports data privacy compliance)

**Relationships**:

- One-to-Many with User (one user → many summaries)
- Many-to-One with ChatSession (summary references source session)

---

### 5. Rate Limit Record (NEW MODEL - Optional, Context-Specific)

**Model Name**: `RateLimitRecord` (optional; may use in-memory counter instead)  
**Location**: `common.models.RateLimitRecord` (or implement in middleware cache)

| Field           | Type          | Constraints                              | Description                |
| --------------- | ------------- | ---------------------------------------- | -------------------------- |
| `id`            | AutoField     | Primary Key                              | Unique identifier          |
| `user_id`       | IntegerField  | indexed                                  | User being rate-limited    |
| `endpoint`      | CharField     | e.g., "/api/chat/send", "/api/profile"   | API endpoint               |
| `request_count` | IntegerField  | default=0                                | Requests in current window |
| `reset_at`      | DateTimeField | auto_now_add=True + timedelta(minutes=1) | When counter resets        |

**Note**: Rate limiting likely handled via middleware with in-memory counter + Redis (if distributed). This model is optional for audit/logging. For v1, middleware counter in memory is sufficient.

---

## Relationships & Data Flow

```
┌─────────────┐
│    User     │ (extended: language_preference)
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       │ (One User → Many Sessions)       │
       │ (One User → Many Summaries)      │
       │                                  │
   ┌───▼─────────────┐  ┌───────────────┐
   │ ChatSession     │  │ UserSummary   │ (NEW)
   │ (extended:      │  │ (NEW MODEL)   │
   │  language_tag,  │  │               │
   │  message_count) │  │ - archive_status
   └───┬─────────────┘  │ - language_tag
       │                │ - date_generated
       │ 1:Many         └───────────────┘
       │                       ▲
   ┌───▼──────────────┐        │
   │ ChatMessage      │        │ (Source)
   │ (extended:       │        │
   │  language_tag)   │────────┘
   └──────────────────┘        (Batch trigger: 5+ messages)
```

## Migration & Backward Compatibility

### Phase 1 Migrations (Django)

1. **Migration 1**: Add `User.language_preference` and `User.language_preference_updated_at`
   - Default to `'en'` for all existing users
   - No data changes; safe for production

2. **Migration 2**: Add `ChatMessage.language_tag` (nullable)
   - Backfill: Tag all messages with `'en'` (assuming existing platform is English-only)
   - Add index on `(user_id, language_tag, created_at)`

3. **Migration 3**: Add `ChatSession.language_tag` and `ChatSession.message_count`
   - Backfill language_tag from user.language_preference
   - Count existing messages for message_count
   - Add indexes

4. **Migration 4**: Create `UserSummary` model
   - Fresh table (no backfill needed; summaries generated going forward)

### Rollback Strategy

- Migrations 1-3 are additive; no breaking changes
- If needed, set `language_preference` to `'en'` for all users and ignore `language_tag` fields
- Migration 4 (UserSummary) is independently droppable if feature rolled back

---

## Validation Rules & Constraints

### At Application Layer

1. **Language Preference**:
   - Only accept `'en'` or `'ar'`
   - Reject with localized error message if invalid

2. **Rate Limiting**:
   - Enforce 100 requests per minute per user
   - Count requests by `user_id` + endpoint path
   - Return 429 with localized message if exceeded

3. **Summary Generation**:
   - Trigger only after session ends with 5+ messages
   - Require non-empty chat history for summary
   - Fail gracefully (log error, show "Summary unavailable" to user)

4. **Language Tag Consistency**:
   - On session create: inherit from user.language_preference
   - On message create: inherit from session.language_tag
   - Do not allow override after creation

---

## Query Performance & Indexing Strategy

| Query                                      | Indexes Needed                         | Expected Rows | Notes                       |
| ------------------------------------------ | -------------------------------------- | ------------- | --------------------------- |
| User summaries (newest first, active only) | `(user_id, archived, -date_generated)` | 5-20          | Profile page load           |
| Summaries by language                      | `(user_id, language_tag, archived)`    | 1-10          | Language filter             |
| Rate limit check                           | In-memory or Redis key                 | 1             | Every API request           |
| Messages by language                       | `(user_id, language_tag, created_at)`  | 1-100         | Chat history filter         |
| Summary generation trigger                 | Query on `message_count >= 5`          | 1-10          | Batch job (1-min intervals) |

**Index Creation**:

```python
# In UserSummary model
class Meta:
    indexes = [
        models.Index(fields=['user', '-date_generated', 'archived']),
        models.Index(fields=['user', 'language_tag', 'archived']),
    ]

# In ChatMessage model
class Meta:
    indexes = [
        models.Index(fields=['user', 'language_tag', '-created_at']),
    ]
```

---

## Scalability Considerations

### At 50K MAU / 5M messages/month

1. **User table**: +1 column (language_preference) — negligible
2. **ChatMessage table**: +1 column (language_tag); likely 2-3GB new storage
3. **ChatSession table**: +2 columns (language_tag, message_count) — negligible
4. **UserSummary table**: New table (~1K-5K rows/month) — <100MB at Y1 scale

### Query Load

- Profile page queries: 100 req/sec peak → indexed; <10ms p99
- Rate limit checks: 500+ req/sec peak → in-memory; <1ms
- Summary generation job: Batch every 1 minute; async; no impact on user load

### Caching Strategy (Optional for v1)

- Cache UserSummary list (5-min TTL) keyed on `user_id`
- Cache language preference (10-min TTL) on session/JWT
- Invalidate on user preference change

---

## Testing Strategy

### Unit Tests

- Language preference validation (accept `'en'`, `'ar'`; reject others)
- Language tag assignment (inherit from user/session)
- Summary archive toggle (soft delete)
- Rate limit counter increment/reset

### Integration Tests

- End-to-end: Create session → add 5+ messages → trigger summary → verify UserSummary created
- Multi-language: User switches language → new messages tagged correctly
- Race conditions: Concurrent messages during rate limit boundary

### Data Migration Tests

- Backfill language_tag for existing messages
- Verify no data loss
- Rollback and re-apply migrations

---

## Future Scalability (Out of Scope for v1)

- Consider eventual consistency for summary generation (fan-out-on-read pattern)
- Shard UserSummary table by language_tag if >10M rows
- Archive old summaries to cold storage (Parquet files, S3)
- Cache summaries in Redis for <1s display latency
