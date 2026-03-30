# Research Findings: Multi-Language User Profiles with AI-Generated Summaries

**Date**: March 30, 2026  
**Feature**: 005-multilang-summaries  
**Phase**: Phase 0 - Research & Technology Evaluation

## Technical Clarifications

All technical context was resolved during specification clarification phase. No NEEDS CLARIFICATION markers remain.

## Technology Decision: AI Summary Generation

**Decision**: Use existing AI model integration (OpenRouter/Groq/Together via Django backend) to generate user summaries. No new ML model training required.

**Rationale**:

- Platform already has multi-model AI architecture via OpenRouter, Groq, Together
- Summaries are text generation task; existing models are capable
- Simplifies v1 scope (no model training pipeline needed)
- Leverages existing Django API layer

**Alternatives Considered**:

- Train custom summarization model: Rejected (adds significant ML infrastructure, increases Y1 timeline from months to quarters, requires labeled training data)
- Use external summarization API (AWS Comprehend, Google summarization API): Rejected (adds external dependency, potential latency, cost, vendor lock-in)

**Implementation**: Add new `summary_service.py` that batches chat history per session and calls existing AI endpoint with summarization prompt

---

## Technology Decision: Language Tagging Strategy

**Decision**: Add `language_tag` field to Chat and Session models; store as ISO 639-1 codes (`en`, `ar`)

**Rationale**:

- Minimal storage overhead (2 bytes per message)
- Industry standard (ISO 639-1); works with existing i18n frameworks
- Enables language-specific filtering and queries
- Simple: no complex language detection; fetch from user.language_preference at request time

**Alternatives Considered**:

- Auto-detect language per message using ML: Rejected (adds per-message inference latency; false positives on code/links; simpler to trust user preference)
- Store language as full name string (e.g., "English"): Rejected (inefficient; complicates filtering)

**Implementation**: Middleware extracts `language_preference` from JWT context; passed to service layer on every request

---

## Technology Decision: User-Facing UI Text Localization

**Decision**: Use existing i18next framework (already in codebase). Add new translation keys to `i18n/en.json` and `i18n/ar.json`

**Rationale**:

- Platform already uses i18next (evidenced by i18n/ folder in constitution)
- No new library needed
- Integrates with existing React i18n hooks
- Supports RTL rendering for Arabic

**Alternatives Considered**:

- Add new localization library (gettext, polyglot): Rejected (platform already standardized on i18next; adds complexity)
- Hardcode English; translate to Arabic later: Rejected (violates constitution Principle II)

**Implementation**: Define new keys for profile page, error messages, rate-limit messages; use React `useTranslation()` hook

---

## Technology Decision: Formal Modern Standard Arabic (MSA) + RTL Support

**Decision**: Configure AI prompt to generate Formal MSA output; configure React/Tailwind for RTL text rendering based on language_preference

**Rationale** (from clarifications):

- MSA is universally understood across Arabic-speaking regions (Egypt, UAE, Saudi Arabia, etc.)
- Avoids dialect fragmentation
- RTL is HTML/CSS standard; Tailwind/React have robust RTL support
- Formal tone appropriate for user-facing summaries and error messages

**Alternatives Considered**:

- Support multiple dialects (Egyptian, Gulf, Levantine): Rejected (increases complexity, translation volume, testing scope; MSA is sufficient for v1)
- Auto-detect RTL: Rejected (simpler to use language_preference; avoids false positives on mixed-language text)

**Implementation**:

- Backend: Pass `language: "ar"` flag to AI API; include MSA prompt instruction
- Frontend: Set `dir="rtl"` on html/body when `language_preference === "ar"`; RTL Tailwind classes available

---

## Technology Decision: Rate Limiting Architecture

**Decision**: Implement at middleware layer (Django `django-ratelimit` or custom middleware); uniform 100 req/min limit for all account types

**Rationale** (from clarifications):

- Middleware is transparent to business logic
- Can be configured centrally; easy to adjust thresholds
- Works for all account types (human users, bots, API clients)
- No special casing; simple audit trail

**Alternatives Considered**:

- Database-backed token bucket: Rejected (adds query overhead for every request; middleware is faster)
- Redis-backed rate limiter: Rejected (adds external dependency; middleware sufficient for scale)
- Different limits per account type: Rejected (clarifications confirmed uniform 100 req/min is simpler and meets business needs)

**Implementation**: Add middleware in `common/middleware/rate_limiter.py`; increment counter keyed by user_id; return 429 if exceeded

---

## Technology Decision: Foreign Key / Summary Aggregation

**Decision**: Add `UserSummary` model with FK to User; display chronologically (newest first) on profile; allow user to archive summaries

**Rationale** (from clarifications):

- Preserves full interaction history (user insight value)
- Chronological display is intuitive
- Archive feature allows users to declutter without data loss
- Simple query: `UserSummary.objects.filter(user=user, archived=False).order_by('-date_generated')`

**Alternatives Considered**:

- Aggregate into single profile summary field: Rejected (loses historical context; makes updates complex)
- Monthly rollup: Rejected (loses session-level granularity; unclear how to handle multi-session months)

**Implementation**: Add `UserSummary` Django model with fields: `user` (FK), `text`, `language_tag`, `date_generated`, `source_session_id`, `relevance_score`, `archived` (boolean)

---

## Performance Considerations

### Summary Generation Latency

- **Goal**: <10 minutes from session end to summary availability
- **Approach**: Asynchronous task (Celery or APScheduler)
- **Trigger**: After Chat session ends with message_count >= 5
- **Batching**: Process summaries on 1-minute intervals (reduces API calls)

### Summary Display Performance

- **Goal**: <2 seconds to display summaries on profile page load
- **Approach**: Query cache (Redis or in-memory) with 5-minute TTL
- **Fallback**: Synchronous DB query if cache miss

### Rate Limiting Performance

- **Goal**: <500ms error response when limit exceeded
- **Approach**: In-memory counter (process-local) with configurable expiry
- **At scale (500 concurrent users)**: Bloom filter or distributed counter if needed

---

## Data Privacy & Compliance

**Approach**: Uniform GDPR compliance; no region-specific storage

- User summaries stored in same database as chat history (SQLite)
- Same encryption, retention, deletion policies apply
- Language_tag is metadata; does not require special privacy handling
- User data remains user-owned; exports include language tags

---

## Risks & Mitigations

| Risk                                           | Likelihood | Impact                          | Mitigation                                                                                   |
| ---------------------------------------------- | ---------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| AI summary generation fails for some sessions  | Medium     | User sees "Summary unavailable" | Add error handling; retry logic; log failures for debugging                                  |
| Rate limit false positives (legitimate bursts) | Low        | User frustration                | Test with realistic traffic patterns; allow burst allowance (e.g., 10-request initial burst) |
| RTL rendering breaks on edge URLs/links        | Low        | Visual glitch for Arabic users  | Component test RTL layout; verify link formatting                                            |
| Formal MSA perceived as stiff by users         | Low        | User feedback negative          | Include in UAT; iterate on tone if needed; MSA remains accessible                            |

---

## Summary & Recommendations

**Key Decisions**:

1. ✅ Use existing AI models; no new ML infrastructure
2. ✅ Add `language_tag` to messages/sessions (ISO 639-1 codes)
3. ✅ Use i18next for UI localization
4. ✅ Formal MSA + RTL for Arabic; MSA universally understood
5. ✅ Middleware-based rate limiting (100 req/min uniform)
6. ✅ UserSummary model with archive capability

**Ready for Phase 1**: All technology choices documented and justified. No blocking dependencies. Architecture fits within existing nexus platform.
