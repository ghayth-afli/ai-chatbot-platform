# Smoke Test Guide - Authentication Feature

## What is a Smoke Test?

A smoke test is a quick verification that critical functionality works after deployment. It checks that the app can start, respond to requests, and execute core user flows without detailed validation.

**Smoke Test Duration**: 10-15 minutes
**Scope**: Core authentication flows only (not exhaustive testing)
**Success Criteria**: All tests pass without errors

---

## Pre-Smoke Test Setup

### 1. Verify Deployment Successful

```bash
# Backend
curl -i https://yourdomain.com/api/auth/login/
# Expected: 405 Method Not Allowed (POST required, but server is reachable)

# Frontend
curl -i https://yourdomain.com/
# Expected: 200 OK with HTML response
```

### 2. Check Service Health

```bash
# Django
python manage.py check --deploy
# Expected: System check identified no issues

# Frontend build
npm run build
# Expected: Success message, build/ directory created
```

### 3. Review Error Logs (Last 10 minutes)

```bash
# Django logs
journalctl -u gunicorn -n 50
# Look for: No [ERROR] or [CRITICAL] messages

# Nginx logs
tail -20 /var/log/nginx/error.log
# Look for: No 5xx errors

# Database connection
python manage.py dbshell -c "SELECT 1;"
# Expected: Returns 1
```

### 4. Verify Environment Variables

```python
# python manage.py shell

# Check critical vars are set
import os

required_vars = [
    'DEBUG',  # Should be False in prod
    'SECRET_KEY',
    'DATABASE_URL',
    'EMAIL_HOST',
    'GOOGLE_OAUTH_CLIENT_ID',
    'JWT_SECRET_KEY',
]

for var in required_vars:
    value = os.getenv(var, '').strip()
    if not value:
        print(f"❌ Missing: {var}")
    else:
        print(f"✅ Set: {var} ({value[:20]}...)")  # Show partial value

# Exit
exit()
```

---

## Test 1: Signup Flow

### 1.1 Happy Path - Successful Signup

```bash
# Request
curl -X POST https://yourdomain.com/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com",
    "password": "SmokeTest123!",
    "full_name": "Smoke Test User",
    "language": "en"
  }'

# Expected Response
# Status: 201 Created
# Body: {
#   "user_id": 123,
#   "email": "smoketest.user@example.com",
#   "full_name": "Smoke Test User",
#   "is_email_verified": false,
#   "message": "Signup successful. Check your email for verification code."
# }

# Verify
# [ ] Status code is 201
# [ ] Response contains user_id, email, full_name
# [ ] is_email_verified is false
# [ ] Email received at test mailbox within 2 minutes
```

### 1.2 Validation - Weak Password

```bash
curl -X POST https://yourdomain.com/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak.password@example.com",
    "password": "123",
    "full_name": "Weak Password User"
  }'

# Expected Response
# Status: 400 Bad Request
# Body: {
#   "password": ["Password must be at least 8 characters"]
# }

# Verify
# [ ] Status code is 400
# [ ] Error message present
# [ ] User NOT created in database
```

### 1.3 Validation - Duplicate Email

```bash
curl -X POST https://yourdomain.com/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com",
    "password": "Duplicate123!",
    "full_name": "Duplicate User"
  }'

# Expected Response
# Status: 400 Bad Request
# Body: {
#   "email": ["Email already registered"]
# }

# Verify
# [ ] Status code is 400
# [ ] Error message about duplicate email
# [ ] Only one user with this email in database
```

---

## Test 2: Email Verification

### 2.1 Get Verification Code

```python
# python manage.py shell

from django.contrib.auth.models import User
from users.models import VerificationCode

# Get the new user we created
user = User.objects.get(email='smoketest.user@example.com')
print(f"User: {user.email}")
print(f"is_email_verified: {user.is_email_verified}")

# Get the code (or check email)
try:
    code = VerificationCode.objects.filter(user=user).latest('created_at')
    print(f"Verification Code: {code.code}")
    print(f"Expires at: {code.expires_at}")
    print(f"Is used: {code.is_used}")
except:
    print("No verification code found - check email inbox")

exit()
```

### 2.2 Verify Email - Valid Code

```bash
curl -X POST https://yourdomain.com/api/auth/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com",
    "code": "123456"  # Use actual code from above
  }'

# Expected Response
# Status: 200 OK
# Body: {
#   "message": "Email verified successfully",
#   "is_email_verified": true
# }

# Verify
# [ ] Status code is 200
# [ ] Success message
# [ ] User's is_email_verified set to true in database

# Check in database:
# python manage.py shell
# >>> from django.contrib.auth.models import User
# >>> User.objects.get(email='smoketest.user@example.com').is_email_verified
# True
```

### 2.3 Verify Email - Invalid Code

```bash
curl -X POST https://yourdomain.com/api/auth/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com",
    "code": "999999"  # Invalid code
  }'

# Expected Response
# Status: 400 Bad Request
# Body: {
#   "error": "Invalid or expired verification code"
# }

# Verify
# [ ] Status code is 400
# [ ] Error message present
# [ ] User is_email_verified remains true (from previous test)
```

---

## Test 3: Login Flow

### 3.1 Login - Valid Credentials

```bash
curl -X POST https://yourdomain.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com",
    "password": "SmokeTest123!"
  }' \
  -c cookies.txt

# Expected Response
# Status: 200 OK
# Body: {
#   "user_id": 123,
#   "email": "smoketest.user@example.com",
#   "full_name": "Smoke Test User",
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expires_in": 900
# }

# Headers
# Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Lax; Path=/
# Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax; Path=/

# Verify
# [ ] Status code is 200
# [ ] response contains user_id, email, access_token
# [ ] Tokens are JWT format (3 parts separated by dots)
# [ ] cookies.txt contains auth_token and refresh_token
# [ ] Cookies have HttpOnly, Secure flags (check with -i flag for headers)
```

### 3.2 Login - Unverified Email (should fail)

```bash
# First, create unverified user (skip verification from Test 2)

curl -X POST https://yourdomain.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "password": "UnverifiedPass123!"
  }'

# Expected Response
# Status: 401 Unauthorized
# Body: {
#   "error": "Email not verified. Please verify your email to login."
# }

# Verify
# [ ] Status code is 401
# [ ] Error message about email verification
```

### 3.3 Login - Wrong Password

```bash
curl -X POST https://yourdomain.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com",
    "password": "WrongPassword123!"
  }'

# Expected Response
# Status: 401 Unauthorized
# Body: {
#   "error": "Invalid email or password"
# }

# Verify
# [ ] Status code is 401
# [ ] Generic error message (doesn't reveal which field is wrong)
```

### 3.4 Rate Limiting - Multiple Failed Attempts

```bash
# Attempt to login 6 times with wrong password (limit is 5 per 15 min)

for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://yourdomain.com/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{
      "email": "smoketest.user@example.com",
      "password": "WrongPassword123!"
    }' \
    -w "\nStatus: %{http_code}\n"
done

# Expected Response (on attempt 6)
# Status: 429 Too Many Requests
# Body: {
#   "error": "Too many login attempts. Try again later."
# }

# Verify
# [ ] First 5 attempts return 401
# [ ] 6th attempt returns 429
# [ ] Rate limit headers present:
#       - X-RateLimit-Limit: 5
#       - X-RateLimit-Remaining: 0
#       - X-RateLimit-Reset: <timestamp>
```

---

## Test 4: Authenticated Endpoints

### 4.1 Get Current User (/me)

```bash
curl -X GET https://yourdomain.com/api/auth/me/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt

# Or using cookies only:
curl -X GET https://yourdomain.com/api/auth/me/ \
  -b cookies.txt

# Expected Response
# Status: 200 OK
# Body: {
#   "user_id": 123,
#   "email": "smoketest.user@example.com",
#   "full_name": "Smoke Test User",
#   "is_email_verified": true,
#   "oauth_provider": null
# }

# Verify
# [ ] Status code is 200
# [ ] Response contains user details
# [ ] No authentication required if cookies are sent
```

### 4.2 Get Current User - Without Auth (should fail)

```bash
curl -X GET https://yourdomain.com/api/auth/me/

# Expected Response
# Status: 401 Unauthorized
# Body: {
#   "detail": "Authentication credentials were not provided."
# }

# Verify
# [ ] Status code is 401
# [ ] No user data returned
```

---

## Test 5: Password Reset Flow

### 5.1 Request Password Reset

```bash
curl -X POST https://yourdomain.com/api/auth/forgot-password/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com"
  }'

# Expected Response
# Status: 200 OK
# Body: {
#   "message": "Password reset code sent to your email"
# }

# Verify
# [ ] Status code is 200
# [ ] Email received with reset code within 2 minutes
# [ ] Email contains reset code (123456)
# [ ] Email contains 10-minute expiration time
```

### 5.2 Get Reset Code

```python
# python manage.py shell

from users.models import PasswordResetCode
from django.contrib.auth.models import User

user = User.objects.get(email='smoketest.user@example.com')
code = PasswordResetCode.objects.filter(user=user).latest('created_at')
print(f"Reset Code: {code.code}")
print(f"Expires at: {code.expires_at}")

exit()
```

### 5.3 Reset Password - Valid Code

```bash
curl -X POST https://yourdomain.com/api/auth/reset-password/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com",
    "code": "123456",  # Use actual code from above
    "new_password": "NewPassword456!"
  }'

# Expected Response
# Status: 200 OK
# Body: {
#   "message": "Password reset successful. You can now login with your new password."
# }

# Verify
# [ ] Status code is 200
# [ ] Success message
```

### 5.4 Login with New Password

```bash
curl -X POST https://yourdomain.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoketest.user@example.com",
    "password": "NewPassword456!"
  }'

# Expected Response
# Status: 200 OK
# Body: Contains access_token, refresh_token

# Verify
# [ ] Status code is 200
# [ ] Login successful with new password
# [ ] Old password no longer works
```

---

## Test 6: Google OAuth Flow

### 6.1 Initiate OAuth (Frontend)

```javascript
// In browser console
// 1. Click "Sign in with Google" button
// 2. Complete Google authentication
// 3. Check that redirect happens to yourdomain.com/auth/callback

// Expected:
// - Google login popup opens
// - Popup closes after authentication
// - Redirected to /auth/callback
// - Access token in URL: ?access_token=...
```

### 6.2 OAuth Callback (Backend)

```bash
# After clicking Google OAuth button, callback URL:
# yourdomain.com/api/auth/google-callback?code=<auth-code>

# Expected Response
# Status: 200 OK
# Redirect to: /chat (if first login)
# Redirect to: /chat (if existing user)

# Cookies:
# - auth_token set
# - refresh_token set
```

### 6.3 Verify OAuth User Created

```python
# python manage.py shell

from django.contrib.auth.models import User
from users.models import OAuthConnection

# Find user created via OAuth
user = User.objects.filter(
    oauth_provider__isnull=False
).latest('-date_joined')

print(f"Email: {user.email}")
print(f"OAuth Provider: {user.oauth_provider}")
print(f"OAuth ID: {user.oauth_id}")

# Check connection
connection = OAuthConnection.objects.get(provider_id=user.oauth_id)
print(f"OAuth Connection: {connection.provider}")

exit()
```

---

## Test 7: Logout & Multi-Tab Detection

### 7.1 Logout

```bash
curl -X POST https://yourdomain.com/api/auth/logout/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt

# Expected Response
# Status: 200 OK
# Body: {
#   "message": "Logout successful"
# }

# Cookies:
# - auth_token cleared (max_age=0)
# - refresh_token cleared (max_age=0)

# Verify
# [ ] Status code is 200
# [ ] Can no longer access /me endpoint
```

### 7.2 Multi-Tab Logout

```javascript
// In browser with 2 tabs open, both logged in:

// Tab 1: Call logout
fetch("/api/auth/logout/", { method: "POST" });

// Tab 2: Should automatically logout within 1 second
// Check localStorage for logout signal
localStore.getItem("authLoggedOut"); // Should be set

// Verify
// [ ] Tab 1 logged out successfully
// [ ] Tab 2 automatically logged out
// [ ] Both redirected to login page
```

---

## Test 8: Token Refresh

### 8.1 Silent Token Refresh

```bash
# Wait for access token to expire (or manually test refresh endpoint)

# From browser with valid refresh_token cookie:
curl -X POST https://yourdomain.com/api/auth/refresh-token/ \
  -b cookies.txt

# Expected Response
# Status: 200 OK
# Body: {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expires_in": 900
# }

# Cookies:
# - auth_token updated

# Verify
# [ ] Status code is 200
# [ ] New access_token returned
# [ ] Can use new token immediately
```

---

## Test 9: RTL & i18n Support

### 9.1 Arabic Language Support

```javascript
// In browser console:

// Check RTL is enabled
document.documentElement.dir; // Should be "rtl" for AR

// Check language selector works
// Click language switch
// Verify:
// [ ] Page direction changes to RTL
// [ ] All text displays in Arabic
// [ ] Login form labels in Arabic
```

### 9.2 English Language Support

```javascript
// Switch to English
// Verify:
// [ ] Page direction is "ltr"
// [ ] All text displays in English
// [ ] Forms display correctly (no text overflow)
```

---

## Test 10: Security Headers

### 10.1 Check Security Headers

```bash
curl -I https://yourdomain.com/

# Expected Headers:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Strict-Transport-Security: max-age=31536000; includeSubDomains
# - Content-Security-Policy: default-src 'self'

# Verify all headers present
for header in "X-Content-Type-Options" "X-Frame-Options" "Strict-Transport-Security"; do
  curl -I https://yourdomain.com/ | grep "$header"
done
```

### 10.2 Check HTTPS/TLS

```bash
# Verify SSL certificate
curl -vI https://yourdomain.com/ 2>&1 | grep "* Server certificate"

# Expected: Valid certificate from trusted CA
# Check: curl https://yourdomain.com/ (should work without warnings)
```

---

## Smoke Test Checklist

```markdown
# Authentication Feature - Smoke Test Checklist

Date: ******\_\_\_\_******
Environment: [ ] Development [ ] Staging [ ] Production
Tester: ******\_\_\_\_******

## Pre-Smoke Test

- [ ] Deployment successful
- [ ] Services running (Django, React, DB)
- [ ] Error logs reviewed
- [ ] Environment variables verified

## Test Results

### Test 1: Signup Flow

- [ ] Happy path signup succeeds (201)
- [ ] Weak password rejected (400)
- [ ] Duplicate email rejected (400)
- [ ] Verification email sent

### Test 2: Email Verification

- [ ] Valid code accepted (200)
- [ ] Invalid code rejected (400)
- [ ] User marked as verified

### Test 3: Login Flow

- [ ] Valid credentials accepted (200)
- [ ] Unverified email rejected (401)
- [ ] Wrong password rejected (401)
- [ ] Rate limiting at 6th attempt (429)
- [ ] Tokens returned and cookies set

### Test 4: Authenticated Endpoints

- [ ] /me endpoint works with auth (200)
- [ ] /me endpoint fails without auth (401)

### Test 5: Password Reset

- [ ] Reset code request works (200)
- [ ] Email sent with code
- [ ] Reset with valid code succeeds (200)
- [ ] Login with new password works

### Test 6: OAuth

- [ ] Google OAuth flow works
- [ ] User account created
- [ ] Tokens set on callback

### Test 7: Logout

- [ ] Logout succeeds (200)
- [ ] Cookies cleared
- [ ] Multi-tab logout works

### Test 8: Token Refresh

- [ ] Token refresh succeeds (200)
- [ ] New token valid immediately

### Test 9: RTL/i18n

- [ ] Arabic display works
- [ ] English display works
- [ ] Language switching works

### Test 10: Security

- [ ] Security headers present
- [ ] HTTPS enforced
- [ ] No mixed content warnings

## Summary

**Total Tests**: 10
**Passed**: \_**\_
**Failed**: \_\_**

**Pass Rate**: \_\_\_\_%

## Issue Summary (if any)

| Test | Issue | Severity | Notes |
| ---- | ----- | -------- | ----- |
|      |       |          |       |

## Sign-Off

- [ ] All critical tests passed
- [ ] Known issues documented
- [ ] Ready for full testing

**Approved by**: ******\_\_\_\_****** **Date**: **\_\_\_\_**

**Notes**: **************************************\_**************************************
```

---

## Useful Commands for Smoke Testing

```bash
# Check all services.ps1
systemctl status gunicorn
systemctl status nginx
systemctl status postgresql

# View recent logs
journalctl -u gunicorn -n 100 --no-pager
journalctl -u nginx -n 50 --no-pager

# Test connectivity
curl -i https://yourdomain.com/
curl -i https://yourdomain.com/api/auth/login/

# Monitor real-time logs
journalctl -u gunicorn -f
journalctl -u nginx -f

# Check disk space (if tests fail due to disk)
df -h

# Check database
psql -h localhost -U postgres -d chatbot_db -c "SELECT COUNT(*) FROM auth_user;"

# Tail mail log (if email tests fail)
tail -f /var/log/mail.log
```

---

## If Smoke Tests Fail

### Step 1: Identify Which Test Failed

- Note the specific test number (e.g., "Test 3.2 Login - Unverified Email")
- Full error message
- HTTP status code

### Step 2: Check Logs

```bash
# Django application log
journalctl -u gunicorn -n 200

# Error database
python manage.py shell
>>> from users.models import ErrorLog
>>> ErrorLog.objects.latest('-created_at')
```

### Step 3: Verify Configuration

```bash
# Check all required settings
python manage.py check --deploy

# Show settings (sanitized)
python manage.py shell
>>> from django.conf import settings
>>> print(settings.DEBUG)  # Should be False
>>> print(settings.ALLOWED_HOSTS)
>>> print(settings.DATABASES)
```

### Step 4: Rollback if Necessary

See: `ROLLBACK_GUIDE.md`

### Step 5: Document & Escalate

- Create incident report with test results
- Escalate to Tech Lead
- Do not mark deployment as "successful" until all smoke tests pass

---

## Post-Smoke Test Cleanup

```python
# python manage.py shell

# Delete test user
from django.contrib.auth.models import User
User.objects.filter(email='smoketest.user@example.com').delete()

# Verify deletion
User.objects.filter(email='smoketest.user@example.com').exists()  # Should be False

exit()
```

---

## References

- DEPLOYMENT_CHECKLIST.md
- ROLLBACK_GUIDE.md
- AUTH_IMPLEMENTATION.md (Backend)
- AUTH_IMPLEMENTATION.md (Frontend)
