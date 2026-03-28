# API Contracts: Authentication Endpoints

**Date**: March 28, 2026 | **Feature**: User Authentication & Authorization  
**Base URL**: `/api/auth`

---

## 1. Signup Endpoint

**POST** `/api/auth/signup`

Create a new user account with email and password.

### Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

| Field      | Type   | Required | Rules                           |
| ---------- | ------ | -------- | ------------------------------- |
| email      | string | Yes      | Valid email, must be unique     |
| password   | string | Yes      | Min 8 chars, validated password |
| first_name | string | No       | Max 150 chars                   |
| last_name  | string | No       | Max 150 chars                   |

### Response

**Status: 201 Created**

```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "auth_provider": "email",
    "is_verified": false,
    "created_at": "2026-03-28T10:30:00Z"
  },
  "message": "Verification code sent to your email"
}
```

### Errors

| Status | Code             | Message                             |
| ------ | ---------------- | ----------------------------------- |
| 400    | EMAIL_EXISTS     | Email already registered            |
| 400    | PASSWORD_INVALID | Password does not meet requirements |
| 400    | VALIDATION_ERROR | Invalid input (see details)         |

### Notes

- Email sent immediately with 6-digit verification code
- User cannot login until email verified
- Verification code expires in 10 minutes

---

## 2. Email Verification Endpoint

**POST** `/api/auth/verify-email`

Verify email address using code sent to inbox.

### Request

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

| Field | Type   | Required | Rules                |
| ----- | ------ | -------- | -------------------- |
| email | string | Yes      | User's email address |
| code  | string | Yes      | Exactly 6 digits     |

### Response

**Status: 200 OK**

```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "user@example.com",
    "is_verified": true,
    "created_at": "2026-03-28T10:30:00Z"
  },
  "message": "Email verified. You can now login."
}
```

### Errors

| Status | Code           | Message                      |
| ------ | -------------- | ---------------------------- |
| 400    | INVALID_CODE   | Code is incorrect or expired |
| 404    | USER_NOT_FOUND | No user with this email      |

### Notes

- Code valid for 10 minutes
- After verification, user can login
- Previous codes invalidated after use

---

## 3. Login Endpoint

**POST** `/api/auth/login`

Authenticate user with email and password. Returns HTTP-only cookies.

### Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

| Field    | Type   | Required | Rules            |
| -------- | ------ | -------- | ---------------- |
| email    | string | Yes      | Registered email |
| password | string | Yes      | Account password |

### Response

**Status: 200 OK**

```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture_url": null,
    "language_preference": "en",
    "is_verified": true
  },
  "access_token_expires_in": 900,
  "refresh_token_expires_in": 604800
}
```

**HTTP Headers** (Response):

```
Set-Cookie: access_token=<JWT>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900
Set-Cookie: refresh_token=<JWT>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

### Errors

| Status | Code                | Message                        |
| ------ | ------------------- | ------------------------------ |
| 401    | INVALID_CREDENTIALS | Email or password incorrect    |
| 400    | USER_NOT_VERIFIED   | Please verify your email first |
| 429    | RATE_LIMIT_EXCEEDED | Too many login attempts        |

### Notes

- Cookies are HTTP-only (JavaScript cannot access)
- Access token valid 15 minutes; refresh token valid 7 days
- Rate limit: 5 attempts per 15 minutes per IP
- User remains logged in until logout or token expires

---

## 4. Logout Endpoint

**POST** `/api/auth/logout`

Clear authentication cookies and invalidate session.

### Request

Empty body (no parameters)

```json
{}
```

### Response

**Status: 204 No Content** (or 200 OK with message)

```json
{
  "message": "Logged out successfully"
}
```

**HTTP Headers** (Response):

```
Set-Cookie: access_token=; Path=/; HttpOnly; Max-Age=0
Set-Cookie: refresh_token=; Path=/; HttpOnly; Max-Age=0
```

### Errors

None (logout always succeeds)

### Notes

- Requires authenticated request (valid cookie)
- Clears all authentication cookies
- Effect immediate; user redirects to login

---

## 5. Refresh Token Endpoint

**POST** `/api/auth/refresh`

Get new access token using valid refresh token.

### Request

Empty body (refresh token from cookie)

```json
{}
```

### Response

**Status: 200 OK**

```json
{
  "access_token_expires_in": 900
}
```

**HTTP Headers** (Response):

```
Set-Cookie: access_token=<new_JWT>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900
```

### Errors

| Status | Code          | Message                                   |
| ------ | ------------- | ----------------------------------------- |
| 401    | TOKEN_EXPIRED | Refresh token expired; please login again |
| 401    | INVALID_TOKEN | Token is invalid                          |

### Notes

- Automatically called by axios interceptor on 401
- Transparent to user; no manual intervention needed
- New access token issued; refresh token unchanged

---

## 6. Forgot Password Endpoint

**POST** `/api/auth/forgot-password`

Send password reset code to user's email.

### Request

```json
{
  "email": "user@example.com"
}
```

| Field | Type   | Required | Rules            |
| ----- | ------ | -------- | ---------------- |
| email | string | Yes      | Registered email |

### Response

**Status: 200 OK**

```json
{
  "message": "Password reset code sent to your email"
}
```

### Errors

| Status | Code                | Message                            |
| ------ | ------------------- | ---------------------------------- |
| 429    | RATE_LIMIT_EXCEEDED | Too many requests; try again later |

### Notes

- Rate limited: 3 requests per 60 minutes per email
- Email sent even if user doesn't exist (security)
- Reset code valid 10 minutes
- No error if email not registered (prevent user enumeration)

---

## 7. Reset Password Endpoint

**POST** `/api/auth/reset-password`

Reset password using code from email.

### Request

```json
{
  "email": "user@example.com",
  "code": "123456",
  "new_password": "NewPass456"
}
```

| Field        | Type   | Required | Rules                   |
| ------------ | ------ | -------- | ----------------------- |
| email        | string | Yes      | User's email            |
| code         | string | Yes      | 6-digit code from email |
| new_password | string | Yes      | Min 8 chars, validated  |

### Response

**Status: 200 OK**

```json
{
  "message": "Password reset successfully. Please login.",
  "redirect_to": "/login"
}
```

### Errors

| Status | Code             | Message                             |
| ------ | ---------------- | ----------------------------------- |
| 400    | INVALID_CODE     | Reset code invalid or expired       |
| 400    | PASSWORD_INVALID | Password does not meet requirements |
| 404    | USER_NOT_FOUND   | User not found                      |

### Notes

- Code valid 10 minutes
- Password must differ from previous passwords (configurable)
- User not auto-logged in; must login with new password
- Code invalidated after use

---

## 8. Google OAuth Endpoint

**POST** `/api/auth/google`

Exchange Google authorization code for JWT tokens and user account.

### Request

```json
{
  "code": "4/0AX4XfWh..."
}
```

| Field | Type   | Required | Rules                          |
| ----- | ------ | -------- | ------------------------------ |
| code  | string | Yes      | Authorization code from Google |

### Response

**Status: 200 OK** (if account created/found) or **Status: 201 Created** (if new account)

```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "user@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture_url": "https://lh3.googleusercontent.com/...",
    "auth_provider": "google",
    "is_verified": true,
    "language_preference": "en"
  },
  "is_new_user": true,
  "access_token_expires_in": 900,
  "refresh_token_expires_in": 604800
}
```

**HTTP Headers** (Response):

```
Set-Cookie: access_token=<JWT>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900
Set-Cookie: refresh_token=<JWT>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

### Errors

| Status | Code                | Message                               |
| ------ | ------------------- | ------------------------------------- |
| 400    | INVALID_CODE        | Authorization code invalid or expired |
| 400    | GOOGLE_AUTH_FAILED  | Failed to verify code with Google     |
| 429    | RATE_LIMIT_EXCEEDED | Too many authentication attempts      |

### Notes

- If user exists with email, logs in (OAuth provider updated)
- If user is new, account auto-created (first_name, last_name, profile_picture from Google)
- Email automatically verified (Google accounts are verified)
- Returns `is_new_user` flag (frontend can show onboarding)
- Google access token discarded; not stored

---

## 9. Current User Endpoint

**GET** `/api/auth/me`

Get currently authenticated user's profile.

### Request

Header:

```
Cookie: access_token=<JWT>
```

No body parameters.

### Response

**Status: 200 OK**

```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture_url": "https://...",
    "auth_provider": "email",
    "is_verified": true,
    "language_preference": "en",
    "created_at": "2026-03-28T10:30:00Z"
  }
}
```

### Errors

| Status | Code              | Message                               |
| ------ | ----------------- | ------------------------------------- |
| 401    | NOT_AUTHENTICATED | No authentication token found         |
| 401    | TOKEN_EXPIRED     | Token expired; refresh or login again |

### Notes

- Requires valid authentication cookie
- Used by frontend to check logged-in status
- Called on app initialization by useAuthStatus hook
- Returns 401 if not authenticated (used to redirect to login)

---

## Authentication Header Format

All requests except signup/login/forgot-password require authentication cookie:

```
Cookie: access_token=<JWT>
```

Backend checks:

1. Cookie present
2. JWT valid (signature, expiration)
3. User exists and is active

If failed, return **401 Unauthorized** with error code.

---

## Rate Limiting

Applied globally and per-endpoint:

| Endpoint           | Rate Limit   | Window              |
| ------------------ | ------------ | ------------------- |
| `/login`           | 5 attempts   | 15 minutes (per IP) |
| `/signup`          | 10 requests  | 1 hour (per IP)     |
| `/forgot-password` | 3 requests   | 1 hour (per email)  |
| `/verify-email`    | 5 requests   | 1 hour (per email)  |
| `/google`          | 10 requests  | 1 hour (per IP)     |
| Other endpoints    | 100 requests | 1 hour (per user)   |

**Response on rate limit exceeded**:

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after": 300
  }
}
```

Status: **429 Too Many Requests**

---

## CORS & Cookies

**CORS Configuration** (Django settings):

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Dev frontend
    "https://nexus.ai",        # Prod frontend
]
CORS_ALLOW_CREDENTIALS = True  # Allow cookies in cross-origin requests
```

**Frontend sends credentials** in Axios:

```javascript
axios.defaults.withCredentials = true;
```

---

## Version & Future Enhancements

**Current Version**: 1.0  
**Date**: March 28, 2026

**Planned Future Endpoints** (Phase 4+):

- `PATCH /api/auth/profile` — Update user profile
- `POST /api/auth/change-password` — Change password (authenticated)
- `POST /api/auth/oauth/google/connect` — Link Google account to email account
- `POST /api/auth/mfa/enable` — Enable 2FA
- `POST /api/auth/mfa/verify` — Verify 2FA code

---

→ **API Contracts Complete** ✅
