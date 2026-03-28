# Authentication Implementation

## Overview

This document describes the complete authentication and authorization implementation for the AI Chat Platform. The system supports:

- **Email/Password Authentication** (US1)
- **Email Verification** (US2)
- **Google OAuth 2.0** (US3)
- **Password Reset** (US4)
- **Secure HTTP-Only Cookies** (US5)
- **Rate Limiting** (5 logins/15min, 3 codes/60min)
- **Multi-Tab Logout Detection**

## Architecture

### Components

1. **Models** (`users/models.py`):
   - Extended Django User with `auth_provider`, `is_verified`, `profile_picture_url`
   - `VerificationCode` model for 6-digit codes (verify/reset types)

2. **Serializers** (`users/serializers.py`):
   - `SignupSerializer`, `LoginSerializer`, `PasswordResetSerializer`, `NewPasswordSerializer`, `VerificationCodeSerializer`, `UserSerializer`

3. **Views** (`users/views.py`):
   - `SignupView`, `LoginView`, `LogoutView`, `VerifyEmailView`, `ForgotPasswordView`, `ResetPasswordView`, `MeView`, `GoogleOAuthView`

4. **Utilities** (`users/utils.py`):
   - `generate_verification_code()`, `generate_reset_code()`
   - `verify_code()` - ATOMIC to prevent race conditions
   - `send_verification_email()`, `send_password_reset_email()`
   - `get_tokens_for_user()`, `set_auth_cookies()`, `clear_auth_cookies()`

5. **Throttles** (`api/throttles.py`):
   - `LoginAttemptThrottle` - 5/15min per IP
   - `VerificationCodeThrottle` - 3/60min per email
   - `ResendCodeThrottle` - 3/60min per email

## API Endpoints

```
POST /api/auth/signup/
  - Body: {email, password, password_confirm, first_name, last_name, language}
  - Returns: {user, message}
  - Status: 201 on success, 400 for validation error

POST /api/auth/verify-email/
  - Body: {email, code}
  - Returns: {user, message}
  - Status: 200 on success, 400 for invalid/expired code

POST /api/auth/login/
  - Body: {email, password}
  - Returns: {user, message, access_token, refresh_token}
  - Sets: access_token, refresh_token cookies (HttpOnly, Secure, SameSite=Lax)
  - Status: 200 on success, 401 for invalid credentials

POST /api/auth/logout/
  - Returns: {message}
  - Clears: access_token, refresh_token cookies
  - Status: 200 on success

POST /api/auth/forgot-password/
  - Body: {email, language}
  - Returns: {message}
  - Status: 200 on success, 404 if user not found
  - Rate Limited: 3/60min per email

POST /api/auth/reset-password/
  - Body: {email, code, new_password, new_password_confirm}
  - Returns: {message}
  - Status: 200 on success, 400 for invalid code/password

POST /api/auth/google/
  - Body: {id_token}
  - Returns: {user, message}
  - Auto-creates user or merges with existing email account
  - Status: 200 on success, 400 for invalid token

GET /api/auth/me/
  - Headers: Authorization: Bearer {access_token}
  - Returns: {user}
  - Status: 200 on success, 401 if not authenticated
```

## Authentication Flow

### Email/Password Signup

```
1. User fills signup form (email, password, name)
2. Frontend calls POST /api/auth/signup/
3. Backend validates input, hashes password with bcrypt
4. Creates User with is_verified=False
5. Generates 6-digit code, stores in VerificationCode table (expires 10min)
6. Sends email with code (EN or AR based on language)
7. Frontend redirects to /verify-email page
```

### Email Verification

```
1. User receives email with 6-digit code
2. User enters code on /verify-email page
3. Frontend calls POST /api/auth/verify-email/ with code
4. Backend validates: code exists, not expired, not used, correct type
5. Backend marks code is_used=True (ATOMIC query)
6. Backend sets user.is_verified=True
7. Frontend redirects to /chat
```

### Login

```
1. User enters credentials on /login page
2. Frontend calls POST /api/auth/login/
3. Backend validates: user exists, password correct, is_verified=True
4. Backend generates JWT tokens (access: 15min, refresh: 7days)
5. Backend sets HttpOnly cookies with Secure + SameSite=Lax flags
6. Backend returns tokens in response body
7. Frontend stores user in localStorage, redirects to /chat
8. Browser automatically sends cookies with subsequent requests
```

### Google OAuth

```
1. User clicks "Sign in with Google" button
2. Frontend opens Google OAuth popup
3. User authenticates with Google
4. Google returns id_token to frontend
5. Frontend calls POST /api/auth/google/ with id_token
6. Backend verifies token signature with Google API
7. Backend extracts: email, name, picture_url
8. Backend finds or creates user: User.objects.get_or_create(email=google_email)
   - If user exists: updates auth_provider='google', profile_picture_url
   - If new: creates user with is_verified=True, auth_provider='google'
9. Backend returns tokens, sets cookies
10. Frontend redirects to /chat
```

### Password Reset

```
1. User clicks "Forgot password?" on /login page
2. User enters email on /forgot-password page
3. Frontend calls POST /api/auth/forgot-password/
4. Backend generates reset code, stores as type='reset'
5. Backend sends email with code
6. Frontend shows "Check your email" message
7. User receives email, clicks link or enters code manually
8. User navigates to /reset-password page with email param
9. User enters code + new password
10. Frontend calls POST /api/auth/reset-password/
11. Backend validates code (type='reset', not expired, not used)
12. Backend hashes new password, updates user.password
13. Backend marks code is_used=True
14. Frontend shows "Password reset successfully" + redirects to /login
15. User logs in with new password
```

## Security Features

### Cookie Security

- **HttpOnly Flag**: JavaScript cannot access tokens, prevents XSS attacks
- **Secure Flag**: Cookies only sent over HTTPS (production)
- **SameSite=Lax**: CSRF protection, prevents cross-site cookie sending

### Password Security

- **Bcrypt Hashing**: Uses Django's `set_password()` with bcrypt backend
- **Requirements**: Min 8 chars, uppercase + lowercase + digit + special char
- **No Plain Storage**: Passwords never stored in logs or response

### Rate Limiting

- **Login**: 5 attempts per 15 minutes per IP → 429 Too Many Requests
- **Verification Codes**: 3 requests per 60 minutes per email
- **Reset Codes**: 3 requests per 60 minutes per email

### Multi-Tab Logout

- When user logs out in one tab, `localStorage.removeItem('user')`
- Storage event fires in other tabs with same origin
- Frontend detects event, clears state, redirects to /login
- All tabs automatically synchronized

### Race Condition Prevention (Atomic)

- Code verification uses atomic database query:

  ```python
  updated = VerificationCode.objects.filter(
    code=code, user=user, is_used=False, type=type
  ).update(is_used=True)

  if updated == 0:
    # Another request beat us to marking as used
    return (False, 'TOKEN_ALREADY_USED')
  ```

- Prevents two concurrent requests from both accepting the same code

## Testing

### Backend Tests

```bash
# Unit tests
python manage.py test users.tests.test_signup \
                       users.tests.test_login \
                       users.tests.test_verify_email \
                       users.tests.test_password_reset \
                       users.tests.test_oauth

# Integration tests
python manage.py test users.tests.test_integration

# Security tests
python manage.py test users.tests.test_security

# With coverage
coverage run --source='users' manage.py test users
coverage report -m  # Target: >90% coverage
```

### Frontend Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### Test Scenarios

1. **Signup → Verify → Login**: Complete user journey
2. **Duplicate Email**: Prevent dual accounts
3. **Weak Password**: Validation enforcement
4. **Unverified User**: Cannot login without verification
5. **Invalid Code**: Rejected for verify/reset
6. **Expired Code**: Rejected after 10 minutes
7. **Used Code**: Cannot reuse same code
8. **Rate Limiting**: 6th login attempt fails with 429
9. **Multi-Tab Logout**: Logout in one tab affects others
10. **Password Reset**: New password works, old password rejected
11. **Google OAuth**: Account merge via email
12. **Cookie Flags**: HttpOnly, Secure, SameSite verified

## Troubleshooting

### User Cannot Login

**Symptoms**: 401 INVALID_CREDENTIALS

**Causes**:

- Wrong password (obvious)
- Email not verified (USER_NOT_VERIFIED error instead)
- Email doesn't exist
- Account deleted

**Solution**: Check error code returned. If USER_NOT_VERIFIED, send reset code.

### Email Not Received

**Symptoms**: Code doesn't arrive

**Causes**:

- EMAIL_HOST not configured
- SMTP credentials wrong
- Email hostname/port blocked by firewall
- Rate limiting: max 3/60min per email

**Solution**: Check Django email backend settings in settings.py. Test with:

```python
from django.core.mail import send_mail
send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])
```

### Stuck in Verification Loop

**Symptoms**: Verify button not working, redirect loop

**Causes**:

- Code expired (10 min TTL)
- Code already used
- Frontend not passing email param correctly

**Solution**: Request new code via "Resend code" button. Check browser console for errors.

### Rate Limit Exceeded

**Symptoms**: 429 Too Many Requests after several attempts

**Causes**:

- 6 failed login attempts in 15 minutes (on same IP)
- 4 code requests in 60 minutes (per email)

**Solution**: Wait for cooldown period. IP-based limits reset automatically.

### Google OAuth Fails

**Symptoms**: "Google authentication failed"

**Causes**:

- GOOGLE_OAUTH_CLIENT_ID not set in env
- Token verification fails (time sync issue)
- Google API rate limited

**Solution**: Verify env vars, check Google API quota, try again in a moment.

## Environment Variables

```
# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@example.com

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxx

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_LIFETIME=900  # 15 minutes in seconds
REFRESH_TOKEN_LIFETIME=604800  # 7 days in seconds

# Rate Limiting
RATE_LIMIT_LOGIN=5/15min
RATE_LIMIT_CODE=3/60min

# Security
DEBUG=False  # Set to True only in development
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## Future Enhancements

- [ ] Two-Factor Authentication (2FA)
- [ ] Social login (Facebook, GitHub, Microsoft)
- [ ] Session management (view active sessions, logout remote sessions)
- [ ] Account linking (merge multiple OAuth providers)
- [ ] Passwordless login (magic links)
- [ ] Biometric authentication (WebAuthn/FIDO2)
- [ ] Login history and security logs
- [ ] IP-based anomaly detection
