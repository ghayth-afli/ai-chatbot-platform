# API Contract: Rate Limiting

**Feature**: Multi-Language User Profiles with AI-Generated Summaries  
**Version**: 1.0  
**Date**: March 30, 2026  
**Stability**: Draft

## Overview

The platform enforces uniform rate limiting on all user-facing API endpoints: **100 requests per minute per user/account**.

This applies equally to:

- Human user accounts (via JWT authentication)
- Bot/service accounts (API-only callers)
- All endpoints (chat, profile, history, etc.)

---

## Rate Limit Specification

### Global Limit

| Parameter               | Value                                       |
| ----------------------- | ------------------------------------------- |
| **Requests per minute** | 100                                         |
| **Applies to**          | All authenticated API endpoints             |
| **Enforcement**         | Per user_id (extracted from JWT) or API key |
| **Window**              | Sliding 60-second window                    |
| **Scope**               | Per user, not global                        |

### Endpoints Covered

- `POST /api/chat/send`
- `GET /api/chat/history/*`
- `GET /api/users/*/profile`
- `GET /api/users/*/profile/summary`
- `POST /api/users/*/profile/summary/*/archive`
- All other authenticated endpoints (existing)

### Endpoints Exempt

- `POST /auth/login` (authentication endpoint)
- `POST /auth/register` (public endpoint)
- `GET /health` (health check)

---

## Rate Limit Response

When a user exceeds the limit (>100 requests in 60 seconds), subsequent requests receive:

### HTTP Response

**Status Code**: `429 Too Many Requests`

**Headers**:

```
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: {unix_timestamp}
```

### Response Body (English User)

```json
{
  "detail": "Request rate limit exceeded: 100 requests per minute. Please retry after 60 seconds.",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60,
  "limit": 100,
  "window": "1 minute",
  "reset_at": "2026-03-30T15:35:00Z"
}
```

### Response Body (Arabic User)

```json
{
  "detail": "تم تجاوز حد معدل الطلب: 100 طلب في الدقيقة. يرجى إعادة المحاولة بعد 60 ثانية.",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60,
  "limit": 100,
  "window": "1 دقيقة",
  "reset_at": "2026-03-30T15:35:00Z"
}
```

---

## Rate Limit Headers

All successful responses (non-429) include rate limit status headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1711883700
```

| Header                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `X-RateLimit-Limit`     | Maximum requests per minute (always 100) |
| `X-RateLimit-Remaining` | Requests remaining in current window     |
| `X-RateLimit-Reset`     | Unix timestamp when window resets        |

---

## Client Behavior

### Recommended Retry Strategy

```javascript
// Pseudocode for client
if (response.status === 429) {
  const retryAfter = response.headers["Retry-After"];
  const delayMs = parseInt(retryAfter) * 1000;

  console.log(`Rate limited. Retrying after ${delayMs}ms`);
  await sleep(delayMs);

  // Retry the request
  return fetch(request);
}
```

### Handling Remaining Quota

```javascript
// Check before making requests
const remaining = parseInt(response.headers["X-RateLimit-Remaining"]);
const resetTime = parseInt(response.headers["X-RateLimit-Reset"]);

if (remaining < 10) {
  console.warn(`Only ${remaining} requests remaining; consider waiting`);
}
```

---

## Implementation Details

### Tracking Mechanism

Rate limits are tracked using a sliding window counter:

1. **Per-user counter**: Keyed by `user_id` (extracted from JWT `sub` claim)
2. **Storage**: In-memory cache (process-local) OR Redis (if distributed architecture)
3. **Reset**: Automatic after 60 seconds (counter expires from cache)

### Middleware Placement

```
Request → Authentication (JWT validation)
        → Rate Limit Check (middleware)
        → [If 429, return error immediately]
        → [If OK, continue to handler]
        → Response (include headers)
```

### Counter Increment

- Incremented **after** successful authentication
- Counted **before** business logic execution
- Not counted for failed authentication (401)

### Edge Cases

#### 1. Request arrives at window boundary

**Scenario**: User has made 100 requests. Request #101 arrives at exactly the 60-second mark.

**Behavior**:

- Old counter expires (removed from cache)
- New counter starts at 1
- Request allowed (within new window)

#### 2. Multiple rapid requests

**Scenario**: Bot makes 200 requests in 1 second.

**Behavior**:

- Requests 1-100: Allowed (200 responses + 200 rate limit headers)
- Requests 101-200: Rejected with 429
- Client receives 100× 200 OK + 100× 429

#### 3. Burst allowance (Optional for v1+)

**Current spec**: No burst allowance; precise 100 req/min  
**Future optimization**: Allow initial burst (e.g., 10 requests without rate limit) for better UX

---

## Testing Strategy

### Unit Tests

- Counter increments correctly on each request
- Counter resets after 60 seconds
- 101st request returns 429
- Response headers present and accurate

### Integration Tests

- Rapid-fire requests trigger 429 at 100+ threshold
- English and Arabic error messages both present
- Retry-After header respected by client
- Concurrent requests from different users are isolated

### Load Tests

- Rate limiter doesn't add >50ms latency per request
- Memory footprint< 100MB at 50K concurrent users
- No counter collision/race conditions

### Security Tests

- Requests without JWT bypass rate limiting gracefully (401 before rate check)
- Rate limit counters cannot be manipulated via headers
- No timing side-channels (no difference in response time for "about to be rate-limited" vs normal)

---

## Monitoring & Alerting

### Metrics to Track

| Metric                              | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `rate_limit.hits`                   | Total requests subject to rate limit                                    |
| `rate_limit.exceeded_count`         | Requests rejected due to 429                                            |
| `rate_limit.exceeded_percentage`    | % of requests rate-limited (target: <1%)                                |
| `rate_limit.peak_requests_per_user` | Max requests/min by any single user (target: <150 for legitimate users) |

### Alert Thresholds

- Alert if `rate_limit.exceeded_percentage` > 5% (may indicate abuse or misconfiguration)
- Alert if individual user makes >500 requests/min (likely bot attack)
- Monitor middleware latency (target: <1ms per request)

---

## Configuration & Tuning

### Adjustable Parameters

In future versions, these can be configured via environment variables:

```python
# backend/settings.py
RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', 100))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv('RATE_LIMIT_WINDOW_SECONDS', 60))

# Environment
export RATE_LIMIT_REQUESTS=200  # Increase to 200/min
export RATE_LIMIT_WINDOW_SECONDS=120  # Change window to 2 minutes
```

### Per-Endpoint Overrides (Optional)

If needed in future, specific endpoints can have different limits:

```python
@rate_limit(requests=50)  # Custom limit for expensive endpoint
def generate_report(request):
    ...
```

---

## Account Type Handling

As determined in clarifications Q4:

### Human Users

- Rate limit: 100 req/min
- Language preference: Required (en/ar)
- Error messages: Localized to user language
- Token: JWT with `language_preference` claim

### Bot/Service Accounts (API-only)

- Rate limit: 100 req/min (same)
- Language preference: Not required
- Error messages: Standard English (no localization needed for API clients)
- Token: API key or JWT (system account)

**Key**: Same rate limit applied uniformly; no special handling

---

## Backward Compatibility

- **v0 → v1**: Rate limiting is new in v1; no existing requests affected during transition
- **Existing APIs**: Rate limiting applied uniformly to all authenticated endpoints
- **Exceptions**: Auth endpoints (login, register) may remain exempt

---

## Examples

### Example 1: Normal Request (Within Limit)

```bash
# Request #42 from user 123
curl -X GET https://api.example.com/api/chat/history/sess-abc \
  -H "Authorization: Bearer {JWT}" \
  -v

# Response
< HTTP/1.1 200 OK
< X-RateLimit-Limit: 100
< X-RateLimit-Remaining: 58
< X-RateLimit-Reset: 1711883700

{"messages": [...]}
```

### Example 2: Rate Limit Exceeded

```bash
# Request #102 from user 123 (after 100 requests in 60 sec)
curl -X POST https://api.example.com/api/chat/send \
  -H "Authorization: Bearer {JWT_ARABIC_USER}" \
  -H "Content-Type: application/json" \
  -d '{"message": "..."}' \
  -v

# Response
< HTTP/1.1 429 Too Many Requests
< Retry-After: 60
< X-RateLimit-Limit: 100
< X-RateLimit-Remaining: 0
< X-RateLimit-Reset: 1711883700

{
  "detail": "تم تجاوز حد معدل الطلب: 100 طلب في الدقيقة. يرجى إعادة المحاولة بعد 60 ثانية.",
  "retry_after": 60,
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```

### Example 3: Client Respects Retry-After

```javascript
// Client code receives 429
if (response.status === 429) {
  const waitSeconds = parseInt(response.headers["Retry-After"]);
  console.log(`Waiting ${waitSeconds} seconds...`);

  await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));

  // Retry (now within new 60-second window)
  const retryResponse = await fetch(originalRequest);
  // Should receive 200 OK
}
```

---

## Compliance & SLAs

- **429 Response Time**: <500ms (requirement from spec SC-006)
- **Accuracy**: 99% (requirement from spec SC-005)
- **Monitoring**: Metrics available in standard application logs
- **Auditing**: Rate limit hits logged per user (for security review)
