# API Contracts: Error Responses

**Date**: March 28, 2026 | **Feature**: User Authentication & Authorization

---

## Standardized Error Response Format

All API errors follow this JSON structure:

```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "status": 400,
  "details": {
    "field_name": ["Specific error description"],
    "another_field": ["Another error"]
  },
  "timestamp": "2026-03-28T10:30:00Z",
  "request_id": "req-uuid-1234"
}
```

| Field      | Type     | Notes                                              |
| ---------- | -------- | -------------------------------------------------- |
| error      | string   | Human-readable message for user                    |
| code       | string   | Machine-readable error code (for frontend routing) |
| status     | integer  | HTTP status code (duplicate of response status)    |
| details    | object   | Field-level errors (validation)                    |
| timestamp  | ISO 8601 | Server time of error                               |
| request_id | string   | Trace ID for debugging                             |

---

## HTTP Status Codes

| Code | Usage                 | Example                    |
| ---- | --------------------- | -------------------------- |
| 200  | Success               | Login successful           |
| 201  | Resource created      | Account created            |
| 204  | Success, no content   | Logout                     |
| 400  | Invalid input         | Email format invalid       |
| 401  | Authentication failed | Token expired              |
| 403  | Permission denied     | User inactive              |
| 404  | Not found             | User not found             |
| 429  | Rate limited          | Too many login attempts    |
| 500  | Server error          | Database connection failed |
| 503  | Service unavailable   | Email service down         |

---

## Authentication Errors (4xx)

### 1. Unauthenticated (401)

User has no valid authentication token.

```json
{
  "error": "Authentication required",
  "code": "NOT_AUTHENTICATED",
  "status": 401,
  "details": {},
  "timestamp": "2026-03-28T10:30:00Z"
}
```

**When**:

- No cookie in request
- Cookie missing access_token
- Accessing protected endpoint without auth

**Frontend action**: Redirect to `/login`

---

### 2. Token Expired (401)

Access token has expired.

```json
{
  "error": "Your session has expired. Please login again.",
  "code": "TOKEN_EXPIRED",
  "status": 401,
  "details": {
    "message": "Access token valid until 2026-03-28T10:45:00Z"
  }
}
```

**When**:

- Access token beyond 15-minute TTL
- Called `/api/auth/refresh` with expired refresh token

**Frontend action**:

1. If refresh token available, call `/api/auth/refresh` to get new access token
2. If refresh token also expired, redirect to `/login`

---

### 3. Invalid Credentials (401)

Email or password is incorrect.

```json
{
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS",
  "status": 401,
  "details": {}
}
```

**When**:

- During login with wrong password
- Email not found in database

**Frontend action**: Show error message; allow retry

**Note**: Intentionally vague (don't reveal if email exists) for security

---

### 4. Email Not Verified (400)

User email has not been verified.

```json
{
  "error": "Please verify your email before logging in",
  "code": "USER_NOT_VERIFIED",
  "status": 400,
  "details": {
    "verification_link": "/verify"
  }
}
```

**When**:

- Login attempt with unverified email
- User created but code not entered

**Frontend action**: Redirect to `/verify` page

---

### 5. Invalid Code (400)

Verification or reset code is wrong or expired.

```json
{
  "error": "Code is incorrect or has expired",
  "code": "INVALID_CODE",
  "status": 400,
  "details": {
    "expires_at": "2026-03-28T10:40:00Z"
  }
}
```

**When**:

- Wrong 6-digit code entered
- Code expired (>10 min old)
- Code already used
- Wrong code type (e.g., password reset code used for email verification)

**Frontend action**:

- Show error message
- Offer "Resend code" button
- Allow retry

---

## Validation Errors (400)

### 6. Email Already Registered (400)

Email is already associated with an account.

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "status": 400,
  "details": {
    "email": ["Email already registered"]
  }
}
```

**When**:

- Signup with existing email
- Email case-insensitive check (USER@GMAIL.COM = user@gmail.com)

**Frontend action**:

- Show error above email field
- Offer "Login" link or "Forgot password" link

---

### 7. Password Invalid (400)

Password does not meet requirements.

```json
{
  "error": "Password does not meet requirements",
  "code": "PASSWORD_INVALID",
  "status": 400,
  "details": {
    "password": [
      "Ensure this field has at least 8 characters.",
      "This password is too common."
    ]
  }
}
```

**When**:

- Password < 8 characters
- Password is common (123456, password, etc.)
- Password is all numeric
- Password same as previous password (if enforced)

**Frontend action**:

- Show error messages for each violation
- Disable submit until corrected
- Show password requirements as user types

---

### 8. Field Validation Error (400)

Generic validation error.

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "status": 400,
  "details": {
    "email": ["Enter a valid email address."],
    "first_name": ["This field is required."],
    "code": ["Ensure this field has at most 6 characters."]
  }
}
```

**When**:

- Missing required fields
- Invalid email format
- Field length constraints violated
- Invalid enum values

**Frontend action**:

- Display per-field errors next to form inputs
- Highlight invalid fields
- Prevent form submission

---

### 9. Invalid Token (401)

Token signature or format is invalid.

```json
{
  "error": "Invalid authentication token",
  "code": "INVALID_TOKEN",
  "status": 401,
  "details": {
    "message": "Token signature verification failed"
  }
}
```

**When**:

- JWT signature doesn't match
- Token has been tampered with
- Token uses wrong algorithm
- Token format is malformed

**Frontend action**: Clear cookies; redirect to `/login`

---

## Rate Limiting Errors (429)

### 10. Too Many Requests (429)

Rate limit exceeded for this endpoint.

```json
{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "status": 429,
  "details": {
    "retry_after": 300,
    "limit": 5,
    "window": 900,
    "remaining": 0
  }
}
```

**When**:

- Login: 5 attempts per 15 minutes per IP
- Signup: 10 attempts per 1 hour per IP
- Forgot password: 3 requests per 1 hour per email
- Verify code: 5 requests per 1 hour per email

**Frontend action**:

- Show error message
- Disable form/button for retry_after seconds
- Show countdown timer: "Try again in X seconds"

**Response headers**:

```
Retry-After: 300
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-03-28T10:45:00Z
```

---

## Not Found Errors (404)

### 11. User Not Found (404)

User with email does not exist.

```json
{
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "status": 404,
  "details": {
    "email": "user@example.com"
  }
}
```

**When**:

- Verify code with non-existent email
- Reset password with unregistered email

**Frontend action**:

- For password reset: "If this email is registered, a reset link has been sent"
- Don't reveal if email exists (prevents user enumeration)

---

## Server Errors (5xx)

### 12. Internal Server Error (500)

Unexpected server error.

```json
{
  "error": "Something went wrong. Please try again later.",
  "code": "INTERNAL_ERROR",
  "status": 500,
  "details": {
    "request_id": "req-uuid-1234"
  }
}
```

**Frontend action**:

- Log error (if analytics available)
- Show generic error message
- Offer "Try again" button or "Contact support" link
- Include request_id in support ticket

---

### 13. Email Service Unavailable (503)

Email service (SMTP, SendGrid, SES) is down.

```json
{
  "error": "Email service temporarily unavailable",
  "code": "EMAIL_SERVICE_ERROR",
  "status": 503,
  "details": {
    "service": "SMTP",
    "message": "Connection timeout"
  }
}
```

**When**:

- SMTP server unreachable
- SendGrid API rate limited or down
- Network timeout sending email

**Frontend action**:

- Show error with retry option
- Suggest trying again in a few minutes
- Log to error tracking service

---

### 14. Database Error (500)

Database connection or query error.

```json
{
  "error": "Database error occurred",
  "code": "DATABASE_ERROR",
  "status": 500,
  "details": {
    "request_id": "req-uuid-1234"
  }
}
```

**Frontend action**:

- Show generic error message
- Offer "Try again" button
- Include request_id in support ticket

---

### 15. Google OAuth Error (400/500)

Error during Google OAuth exchange.

```json
{
  "error": "Failed to authenticate with Google",
  "code": "GOOGLE_AUTH_FAILED",
  "status": 400,
  "details": {
    "reason": "invalid_grant",
    "description": "The authorization code is invalid or expired"
  }
}
```

**When**:

- Authorization code is invalid
- Authorization code has expired
- Google API error
- Signature verification failed

**Frontend action**:

- Show error message
- Offer to retry OAuth flow
- Fall back to email signup

---

## Error Handling Summary Table

| Code                | HTTP | Meaning            | User Action              |
| ------------------- | ---- | ------------------ | ------------------------ |
| NOT_AUTHENTICATED   | 401  | No token           | Go to login              |
| TOKEN_EXPIRED       | 401  | Token old          | Auto-refresh or re-login |
| INVALID_CREDENTIALS | 401  | Wrong password     | Retry or reset password  |
| USER_NOT_VERIFIED   | 400  | Email not verified | Go to verify page        |
| INVALID_CODE        | 400  | Wrong/expired code | Resend code or retry     |
| EMAIL_EXISTS        | 400  | Email registered   | Login or reset password  |
| PASSWORD_INVALID    | 400  | Weak password      | Update password          |
| VALIDATION_ERROR    | 400  | Invalid input      | Fix form fields          |
| INVALID_TOKEN       | 401  | Corrupted token    | Re-login                 |
| RATE_LIMIT_EXCEEDED | 429  | Too many requests  | Wait and retry           |
| USER_NOT_FOUND      | 404  | Email not found    | Check email or signup    |
| INTERNAL_ERROR      | 500  | Server error       | Retry or contact support |
| EMAIL_SERVICE_ERROR | 503  | Email down         | Retry later              |
| DATABASE_ERROR      | 500  | DB error           | Retry or contact support |
| GOOGLE_AUTH_FAILED  | 400  | OAuth failed       | Retry or use email       |

---

## Frontend Error Display Strategy

### 1. Field-Level Errors (Validation)

Display below each form field:

```
Email: [user@example.com]
❌ Email already registered

Password: [••••••••]
❌ Password must be at least 8 characters
❌ This password is too common
```

### 2. Form-Level Errors (Auth)

Display above form:

```
⚠️ Invalid email or password
[Email field]
[Password field]
[Login button]
```

### 3. Rate Limit Errors

Show countdown and disable action:

```
⚠️ Too many login attempts

Try again in: 4:55

[Login button] (disabled)
```

### 4. Network/Server Errors

Show dismissable alert:

```
🚨 Something went wrong (req-uuid-1234)
Please try again or contact support.
[Retry]  [Dismiss]
```

---

## CORS Error Handling

If CORS origin not allowed:

```json
{
  "error": "Cross-Origin Request Blocked",
  "code": "CORS_ERROR",
  "status": 403,
  "details": {
    "origin": "https://evil.com",
    "allowed_origins": ["https://nexus.ai"]
  }
}
```

**Frontend action**: Check environment; likely development/production mismatch

---

## Internationalization (i18n)

All error messages must support EN and AR translations:

```javascript
// frontend/src/i18n/translations/en.json
{
  "errors": {
    "INVALID_CREDENTIALS": "Invalid email or password",
    "PASSWORD_INVALID": "Password does not meet requirements"
  }
}

// frontend/src/i18n/translations/ar.json
{
  "errors": {
    "INVALID_CREDENTIALS": "بريد إلكتروني أو كلمة مرور غير صحيحة",
    "PASSWORD_INVALID": "كلمة المرور لا تلبي المتطلبات"
  }
}
```

Backend returns error code; frontend translates using i18next.

---

→ **Error Response Contracts Complete** ✅
