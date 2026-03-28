# Phase 0: Research — Authentication & Authorization

**Date**: March 28, 2026 | **Feature**: User Authentication & Authorization  
**Status**: Complete | **Output**: Research findings for Phase 1 design

## Overview

This research phase resolves technical unknowns from the implementation plan. All clarifications below inform the design phase (Phase 1).

---

## 1. Email Service Integration

### Decision: Django Default Email Backend (SMTP)

**Investigation**:

- SES ($0.10/1000 emails), SendGrid ($20-100/month), Postmark (pay-per-use), or Django SMTP
- Nexus project has no external service integrations yet
- Development uses localhost SMTP simulation

**Resolution**:

```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'  # Default
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')  # Gmail or SendGrid
EMAIL_PORT = env('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')  # App password, not account password
DEFAULT_FROM_EMAIL = 'noreply@nexus.ai'
```

For production, use **Gmail (free tier for <2000/day)** or **SendGrid (free tier for 100/day)**. Environment variables switch between development SMTP simulation and production service.

**Implementation**:

- `backend/config/emails.py` handles all email rendering (templates)
- `backend/users/tasks.py` (Celery optional) sends emails asynchronously
- Verification codes sent immediately; password resets sent immediately
- Bilingual templates: `verify_email.html` → `verify_email.ar.html`

---

## 2. Google OAuth Configuration

### Decision: Backend Token Exchange (Redirect → Confirm)

**CLARIFICATION (Q1)**: Account Merging - If user previously signed up with email/password and later signs in with Google using same email, **MERGE both auth methods into one user account**. Do NOT create duplicate users.

**Investigation**:

- Option A: Frontend-only OAuth (no backend involvement, security risk)
- Option B: Backend-redirected OAuth (redirect user to Google, backend confirms)
- Option C: Use OAuth library (google-auth, allauth, authlib)

**Resolution**: Option B with **google-auth-httplib2** library

Frontend flow:

1. User clicks "Sign in with Google" button
2. Frontend opens Google OAuth consent screen (via google_login npm package or manual redirect)
3. Google redirects to `/auth/callback?code=<auth_code>` on frontend
4. Frontend sends auth code to `POST /api/auth/google` with code
5. Backend exchanges code for tokens (ID token, access token) using google-auth library
6. **Backend lookup strategy (Q1 Account Merge)**:
   - Extract email from ID token
   - If user with that email exists: Update `auth_provider` to include 'google' (or 'both'). Do NOT create new user.
   - If user doesn't exist: Create new user with auth_provider='google', is_verified=True
7. Return HTTP-only auth cookie
8. Frontend redirected to `/chat`

**Backend implementation**:

```python
# requirements.txt
google-auth-httplib2==0.1.0
google-auth-oauthlib==1.0.0

# settings.py
GOOGLE_OAUTH_CLIENT_ID = env('GOOGLE_OAUTH_CLIENT_ID')  # From Google Cloud Console
GOOGLE_OAUTH_CLIENT_SECRET = env('GOOGLE_OAUTH_CLIENT_SECRET')

# users/views.py
@api_view(['POST'])
def google_auth(request):
    """Exchange Google auth code for JWT + user account (with account merging)"""
    code = request.data.get('code')

    # Verify token with Google
    google_token_info = fetch_google_token_info(code)
    email = google_token_info['email']

    # MERGING LOGIC (Q1): Check if user exists by email
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'auth_provider': 'google',
            'is_verified': True,  # Google auto-verified
            'first_name': google_token_info.get('given_name', ''),
            'profile_picture_url': google_token_info.get('picture', ''),
        }
    )

    # If user already exists (from email signup), update auth_provider
    if not created and user.auth_provider == 'email':
        user.auth_provider = 'both'  # Now supports both methods
        user.is_verified = True
        user.save()

    # Generate tokens and set cookies
    access_token, refresh_token = get_tokens_for_user(user)
    # ... set HTTP-only cookies ...
    return Response({'user': UserSerializer(user).data})
```

**Frontend implementation**:

```javascript
// services/authService.js
export const googleAuth = async (authCode) => {
  const response = await axios.post("/api/auth/google", { code: authCode });
  return response.data; // {user, access_token_expires_in, refresh_token_expires_in}
};

// Google redirect URI in Google Cloud: http://localhost:3000/auth/callback (dev)
```

---

## 3. JWT Token Strategy

### Decision: Access Token (15 min) + Refresh Token (7 days) + HTTP-only Cookies

**CLARIFICATION (Q2)**: Access token expiry is handled via **silent auto-refresh** using axios interceptor. When access token expires (15 min), frontend automatically calls `/api/auth/refresh` to get new token and retries the original request without user seeing any error.

**Investigation**:

- Access token: Short-lived (15 min), stored in HTTP-only cookie, auto-attached to requests
- Refresh token: Long-lived (7 days), stored in HTTP-only cookie, used to refresh access
- **Auto-refresh**: axios interceptor catches 401, calls refresh endpoint, retries original request
- Blacklist strategy: Optional; logout can be instant via cookie deletion

**Resolution**: Use `djangorestframework-simplejwt` (already installed)

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': settings.SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Cookies instead of Authorization header
JWT_AUTH_COOKIE = 'access_token'
JWT_AUTH_REFRESH_COOKIE = 'refresh_token'
```

**Token Flow (Updated with Auto-Refresh)**:

1. `POST /api/auth/login` → Backend validates credentials → generates access_token + refresh_token → sets HTTP-only cookies
2. Axios interceptor auto-attaches access_token cookie to all requests
3. **If `401 Unauthorized` (token expired)**:
   - Axios interceptor automatically calls `POST /api/auth/refresh`
   - New access_token cookie is set
   - **Original request is retried silently** (user doesn't see error)
4. If refresh token also expired (7 days), system redirects to login page
5. `POST /api/auth/logout` → clears cookies (max-age=0)

**Frontend Implementation** (axios interceptor):

```javascript
// authService.js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await api.post("/auth/refresh");
        // New token automatically in cookie, retry original request
        return api(originalRequest);
      } catch (err) {
        // Refresh failed, redirect to login
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
```

**No Blacklist**: Logout is instant via cookie deletion in browser. Token remains valid on backend for 15 min, but frontend cannot use it (no cookie).

**Alternative**: Add TokenBlacklist model for mid-session revocation (not Phase 3).

---

## 4. Cookie Security

### Decision: HttpOnly + Secure + SameSite=Lax

**Investigation**:

- HttpOnly: Prevents JavaScript access (XSS protection)
- Secure: Sent only over HTTPS (not HTTP)
- SameSite: Lax/Strict prevents CSRF
- Domain/Path: Set explicitly to prevent cross-domain leaks

**Resolution**:

```python
# settings.py
SECURE_COOKIE_HTTPONLY = True
SECURE_COOKIE_SECURE = True  # Only set if HTTPS; disable for localhost dev
SECURE_COOKIE_SAMESITE = 'Lax'  # Lax allows top-level navigation links; Strict blocks
SESSION_COOKIE_DOMAIN = '.nexus.ai'  # Set for prod; localhost for dev
SESSION_COOKIE_PATH = '/'
```

**Testing**:

```javascript
// Frontend E2E (Playwright)
test("Cookies set with HttpOnly flag", async ({ page, context }) => {
  const cookies = await context.cookies();
  const accessToken = cookies.find((c) => c.name === "access_token");
  expect(accessToken.httpOnly).toBe(true);
  expect(accessToken.secure).toBe(true); // Only on HTTPS
  expect(accessToken.sameSite).toBe("Lax");
});
```

**Cross-domain**: If API is api.nexus.ai and frontend is nexus.ai, set domain to .nexus.ai. For localhost, omit domain (localhost default).

---

## 5. Rate Limiting Strategy

### Decision: DRF Throttling (Built-in, No External Library)

**Investigation**:

- django-ratelimit: External library, 1 dependency
- DRF throttling: Built-in, uses cache framework, flexible

**Resolution**: DRF throttling with cache backend

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5/15min',  # 5 requests per 15 minutes for unauthenticated
        'user': '100/hour',   # 100 requests per hour for authenticated
    }
}

# users/throttles.py (custom)
class LoginAttemptThrottle(AnonRateThrottle):
    scope = 'login_attempts'
    # 5 failed attempts per 15 minutes per IP

class VerificationCodeThrottle(AnonRateThrottle):
    scope = 'verification_code'
    # 3 code requests per 60 minutes per email (tracked via cache key)
```

**Custom throttling**:

```python
# users/views.py
from rest_framework.throttling import ScopedRateThrottle

class LoginAttemptThrottle(ScopedRateThrottle):
    scope = 'login_attempts'
    THROTTLE_RATES = {'login_attempts': '5/15min'}

@api_view(['POST'])
@throttle_classes([LoginAttemptThrottle])
def login(request):
    # If throttled, return 429 Too Many Requests
    ...
```

**Email-based throttling** (verification code):

```python
# Track by email, not IP
cache.get_or_set(f'verification_code_{email}', 0)
if cache.get(f'verification_code_{email}') >= 3:
    return Response({'error': 'Too many requests'}, status=429)
cache.incr(f'verification_code_{email}')
cache.expire(f'verification_code_{email}', 3600)  # 1 hour
```

---

## 6. Email Verification Code Design

### Decision: 6-Digit Random Code, 10-Minute TTL, Resendable

**Investigation**:

- 4-digit codes: Too easily guessable (10,000 combinations)
- 6-digit codes: 1,000,000 combinations; SMS/email common standard
- 8-character strings: Harder to type; reduces UX
- JWT tokens: Overcomplicated; doesn't fit email use case

**Resolution**:

```python
# users/models.py
class VerificationCode(models.Model):
    VERIFY_EMAIL = 'verify'
    RESET_PASSWORD = 'reset'
    TYPE_CHOICES = [(VERIFY_EMAIL, 'Email Verification'), (RESET_PASSWORD, 'Password Reset')]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)  # 6-digit code
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    expires_at = models.DateTimeField()  # 10 minutes from creation
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

# users/utils.py
import random
def generate_verification_code():
    return str(random.randint(100000, 999999))  # Always 6 digits
```

**Expiration flow**:

```python
def verify_code(email, code, verify_type):
    try:
        vc = VerificationCode.objects.get(
            user__email=email,
            code=code,
            type=verify_type,
            is_used=False,
            expires_at__gt=timezone.now()
        )
        vc.is_used = True
        vc.save()
        return True
    except VerificationCode.DoesNotExist:
        return False  # Expired or invalid
```

**Resend logic**:

- Invalidate all previous codes for that user/type
- Generate and send new code
- Return 429 if 3rd request within 1 hour

---

## 7. User Profile Picture Storage (Google OAuth)

### Decision: Store Google Profile Picture URL, Not Download Locally

**Investigation**:

- Option A: Store Google profile picture URL (always fresh, no storage cost)
- Option B: Download and store locally (CDN cost, outdated if user changes)
- Option C: Use S3/Azure storage (cost, complexity)

**Resolution**: Option A — store URL

```python
# users/models.py
class User(models.Model):
    # Django native fields: username, email, password, first_name, last_name
    auth_provider = models.CharField(
        max_length=10, choices=[('email', 'Email'), ('google', 'Google')],
        default='email'
    )
    profile_picture_url = models.URLField(null=True, blank=True)  # Google picture URL

# users/views.py
def google_auth(request):
    # Exchange auth code for Google ID token
    id_info = id_token.verify_oauth2_token(token, request)

    email = id_info['email']
    name = id_info['name']  # "John Doe"
    picture_url = id_info.get('picture')  # Google-hosted URL

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': name.split()[0],
            'last_name': name.split()[1] if len(name.split()) > 1 else '',
            'auth_provider': 'google',
            'profile_picture_url': picture_url,
            'is_active': True,
            'is_verified': True,  # Google auth = verified
        }
    )

    # Create JWT tokens and return
    refresh = RefreshToken.for_user(user)
    return Response({
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
    })
```

**Default avatar**: If no profile_picture_url, frontend displays Tailwind placeholder/initials.

---

## 8. Password Hashing & Security

### Decision: Django's Default bcrypt (via PBKDF2 fallback)

**Investigation**:

- bcrypt: Industry standard; Django supports it
- Argon2: Stronger; requires argon2-cffi library
- PBKDF2: Django default; acceptable but slower than bcrypt

**Resolution**: Use Django's built-in `make_password()` (PBKDF2 by default, bcrypt if installed)

```python
# requirements.txt
bcrypt==4.1.2

# settings.py
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',  # Fallback
]

# users/views.py
def signup(request):
    email = request.data.get('email')
    password = request.data.get('password')

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password  # Auto-hashed via create_user()
    )
    # Don't use: user.password = password; user.save()
```

**Password validation**:

```python
from django.core.validators import MinLengthValidator

# settings.py
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# users/views.py
try:
    validate_password(password, user=user)
except ValidationError as e:
    return Response({'error': e.messages}, status=400)
```

---

## 9. Frontend Authentication State Management

### Decision: useAuthStatus Hook + AuthGuard Component

**Investigation**:

- Redux: Overkill for auth state; adds complexity
- Zustand: Lightweight; good choice but context sufficient
- Context API: Built-in; perfect for auth state

**Resolution**: React Context + useAuthStatus hook (synchronize with backend)

```javascript
// frontend/src/hooks/useAuthStatus.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const useAuthStatus = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // On mount, check if user is authenticated (GET /api/auth/me)
    axios
      .get("/api/auth/me")
      .then((resp) => {
        setUser(resp.data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await axios.post("/api/auth/logout");
    setUser(null);
    navigate("/login");
  };

  return { user, loading, logout, isAuthenticated: !!user };
};

// frontend/src/App.jsx
import { useAuthStatus } from "./hooks/useAuthStatus";

function App() {
  const { user, loading } = useAuthStatus();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Landing />} />
      <Route
        path="/chat"
        element={user ? <Chat /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}
```

**AuthGuard component**:

```javascript
// frontend/src/components/auth/AuthGuard.jsx
export const AuthGuard = ({ children }) => {
  const { user, loading } = useAuthStatus();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// Usage:
<Route
  path="/chat"
  element={
    <AuthGuard>
      <Chat />
    </AuthGuard>
  }
/>;
```

---

## 10. Error Response Standardization

### Decision: Consistent Error Response Format

**Investigation**:

- Multiple error formats: field errors, validation errors, auth errors
- Need consistent structure for frontend error handling

**Resolution**: Standardized error response

```python
# Backend response format
{
  "error": "string",
  "code": "ERROR_CODE",
  "details": {
    "field_name": ["error message"],
    ...
  },
  "status": 400
}

# Examples:
# 1. Validation error (signup)
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": ["Email already registered"],
    "password": ["Password must be at least 8 characters"]
  }
}

# 2. Rate limit error
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after": 300
  }
}

# 3. Auth error
{
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS",
  "details": {}
}
```

**Frontend error handling**:

```javascript
// services/authService.js
export const login = async (email, password) => {
  try {
    const response = await axios.post("/api/auth/login", { email, password });
    return response.data;
  } catch (error) {
    const errData = error.response?.data || { error: "Network error" };
    throw {
      message: errData.error,
      code: errData.code,
      details: errData.details,
    };
  }
};

// Component
const [errors, setErrors] = useState({});
try {
  const result = await login(email, password);
  // Success
} catch (error) {
  setErrors(error.details || { general: error.message });
}
```

---

## 11. Internationalization & RTL Layout

### Decision: CSS-Driven RTL with `dir` Attribute (No HTML Duplication)

**CLARIFICATION (Q3)**: Frontend forms supporting both English (LTR) and Arabic (RTL) use **CSS-driven layout flipping** with single HTML structure. No separate AR components.

**Investigation**:

- Option A: CSS-driven RTL (single HTML, `dir="rtl"` + CSS reversal)
- Option B: Duplicate HTML components (separate EN and AR components)
- Option C: RTL framework library (auto-mirrors everything)

**Resolution**: Option A - CSS-driven RTL with Tailwind CSS

**Backend email templates**:

```html
<!-- backend/templates/emails/verify_email.html (English) -->
<p>Your verification code: <strong>{{ code }}</strong></p>
<p>This code expires in 10 minutes.</p>

<!-- backend/templates/emails/verify_email.ar.html (Arabic, RTL) -->
<div dir="rtl">
  <p>رمز التحقق الخاص بك: <strong>{{ code }}</strong></p>
  <p>سينتهي صلاحية هذا الرمز في 10 دقائق.</p>
</div>
```

**Frontend forms**:

```jsx
// frontend/src/components/auth/LoginForm.jsx
import { useTranslation } from "react-i18next";

export const LoginForm = () => {
  const { i18n } = useTranslation();

  return (
    <form dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      {/* Single HTML structure, CSS handles flipping */}
      <div className="flex flex-row-reverse gap-4">
        {/* flex-row-reverse flips layout in RTL */}
        <input type="email" placeholder={t("email")} />
        <label>{t("email_label")}</label>
      </div>

      <button className="bg-volt">{t("login")}</button>
    </form>
  );
};
```

**Tailwind CSS RTL support**:

Tailwind automatically handles RTL via `dir="rtl"` attribute:

- `ml-4` (margin-left) becomes `mr-4` (margin-right) in RTL
- `flex-row-reverse` flips flex direction
- `text-right` auto-applies in RTL
- `border-l` (border-left) becomes `border-r` in RTL

**i18n configuration**:

```javascript
// frontend/src/i18n/config.js
import i18n from "i18next";

i18n.init({
  resources: {
    en: { translation: require("./en.json") },
    ar: { translation: require("./ar.json") },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Auto-set document direction
i18n.on("languageChanged", (lng) => {
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
});

export default i18n;
```

**No HTML duplication**:

- Single form template for both EN and AR
- CSS handles visual flipping
- Tailwind `flex-row-reverse`, `text-right`, etc. auto-apply
- i18next changes text only, not structure

**Testing RTL**:

```javascript
// frontend/src/__tests__/rtl.test.jsx
test("Form renders with RTL attributes in Arabic", () => {
  i18n.changeLanguage("ar");
  const { container } = render(<LoginForm />);
  const form = container.querySelector("form");
  expect(form.dir).toBe("rtl");
  expect(document.documentElement.dir).toBe("rtl");
});

test("Form renders with LTR attributes in English", () => {
  i18n.changeLanguage("en");
  const { container } = render(<LoginForm />);
  const form = container.querySelector("form");
  expect(form.dir).toBe("ltr");
});
```

---

## Summary: Research Complete ✅

All technical unknowns resolved:

| Unknown             | Decision                                         |
| ------------------- | ------------------------------------------------ |
| Email service       | Django SMTP (Gmail/SendGrid prod)                |
| Google OAuth        | Backend token exchange with account merging (Q1) |
| JWT tokens          | 15-min access + 7-day refresh, HTTP-only cookies |
| Token refresh       | Silent auto-refresh via axios interceptor (Q2)   |
| Cookie security     | HttpOnly + Secure + SameSite=Lax                 |
| Rate limiting       | DRF throttling (built-in)                        |
| Verification codes  | 6-digit random, 10-min TTL, atomic is_used (Q4)  |
| Profile pictures    | Gmail-hosted URLs, stored in DB                  |
| Password hashing    | Django bcrypt (PBKDF2 fallback)                  |
| Frontend auth state | useAuthStatus hook + Context API                 |
| Error responses     | Standardized format with code/details            |
| i18n & RTL          | CSS-driven RTL with `dir` attribute (Q3)         |

→ **Phase 1 Design ready to proceed**: Data model, API contracts, and quickstart can now be finalized with all clarifications integrated.
