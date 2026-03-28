# Phase 1: Implementation Quickstart

**Date**: March 28, 2026 | **Feature**: User Authentication & Authorization  
**Status**: Ready for Phase 2 (Tasks) | **Next**: Run `/speckit.tasks` to generate task list

---

## Overview

This quickstart provides step-by-step implementation guidance for Phase 3 authentication. Designed for developers to follow sequentially, with references to detailed specs.

**Time estimate**: ~80-120 hours for complete implementation (backend + frontend + testing)

---

## Part 1: Backend Setup

### Step 1.1: Django Configuration

Add authentication settings to `backend/config/settings.py`:

```python
# ──── EMAIL ────
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='localhost')
EMAIL_PORT = env('EMAIL_PORT', default=1025)
EMAIL_USE_TLS = env('EMAIL_USE_TLS', default=False)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@nexus.ai')

# ──── JWT AUTHENTICATION ────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': settings.SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'AUTH_COOKIE': 'access_token',
    'AUTH_COOKIE_REFRESH': 'refresh_token',
    'AUTH_COOKIE_DOMAIN': None,  # Set to .nexus.ai in production
    'AUTH_COOKIE_SECURE': False,  # Set to True in production (HTTPS only)
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax',
}

# ──── REST FRAMEWORK ────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login_attempts': '5/15min',
        'verification_code': '3/60min',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
    'EXCEPTION_HANDLER': 'api.exceptions.custom_exception_handler',
}

# ──── CORS ────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True

# ──── GOOGLE OAUTH ────
GOOGLE_OAUTH_CLIENT_ID = env('GOOGLE_OAUTH_CLIENT_ID', default='')
GOOGLE_OAUTH_CLIENT_SECRET = env('GOOGLE_OAUTH_CLIENT_SECRET', default='')

# ──── SECURITY ────
SECURE_COOKIE_HTTPONLY = True
SECURE_COOKIE_SECURE = False  # Set to True in production
SECURE_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 1209600  # 2 weeks (refresh token lifetime)
```

Update `.env`:

```bash
# Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
```

### Step 1.2: Create Database Models

Create `backend/users/models.py`:

```python
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import random

class VerificationCode(models.Model):
    TYPE_CHOICES = [
        ('verify', 'Email Verification'),
        ('reset', 'Password Reset'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=['user', 'type'])]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'type'],
                condition=models.Q(is_used=False),
                name='unique_active_code'
            ),
        ]

    @classmethod
    def create_code(cls, user, code_type):
        cls.objects.filter(user=user, type=code_type, is_used=False).update(is_used=True)
        code = str(random.randint(100000, 999999))
        return cls.objects.create(
            user=user,
            code=code,
            type=code_type,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()
```

Run migrations:

```bash
python manage.py makemigrations users
python manage.py migrate users
```

### Step 1.3: Create Serializers

Create `backend/users/serializers.py`:

```python
from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.validators import validate_password
from .models import VerificationCode

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'auth_provider', 'is_verified', 'profile_picture_url')

    auth_provider = serializers.CharField(default='email')
    is_verified = serializers.BooleanField(default=False)
    profile_picture_url = serializers.URLField(required=False, allow_blank=True)

class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(required=False, max_length=150)
    last_name = serializers.CharField(required=False, max_length=150)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
```

### Step 1.4: Create API Views

Create `backend/users/views.py`:

```python
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .serializers import *
from .models import VerificationCode
from .utils import send_verification_email, send_password_reset_email

class LoginAttemptThrottle(AnonRateThrottle):
    scope = 'login_attempts'

@api_view(['POST'])
def signup(request):
    """Register new user"""
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = User.objects.create_user(
            username=serializer.validated_data['email'],
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', ''),
        )
        user.is_verified = False
        user.save()

        # Create and send verification code
        vc = VerificationCode.create_code(user, 'verify')
        send_verification_email(user.email, vc.code)

        return Response(
            {'message': 'Verification code sent to your email'},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@throttle_classes([LoginAttemptThrottle])
def login(request):
    """Authenticate user and return JWT tokens"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        if not user:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_verified:
            return Response(
                {'error': 'Please verify your email first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate tokens via simplejwt
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        response = Response(
            {'user': UserSerializer(user).data},
            status=status.HTTP_200_OK
        )
        # Set HTTP-only cookies
        response.set_cookie('access_token', str(refresh.access_token), httponly=True)
        response.set_cookie('refresh_token', str(refresh), httponly=True)

        return response

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def verify_email(request):
    """Verify email with code"""
    serializer = VerifyCodeSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            vc = VerificationCode.objects.get(
                user=user,
                code=serializer.validated_data['code'],
                type='verify'
            )
            if not vc.is_valid():
                return Response(
                    {'error': 'Code is invalid or expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            vc.is_used = True
            vc.save()
            user.is_verified = True
            user.save()

            return Response({'message': 'Email verified'})
        except (User.DoesNotExist, VerificationCode.DoesNotExist):
            return Response(
                {'error': 'Invalid code'},
                status=status.HTTP_400_BAD_REQUEST
            )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout(request):
    """Clear authentication cookies"""
    response = Response({'message': 'Logged out'})
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response

@api_view(['GET'])
def current_user(request):
    """Get authenticated user info"""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    return Response({'user': UserSerializer(request.user).data})
```

### Step 1.5: Create URL Routes

Create `backend/users/urls.py`:

```python
from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('me/', views.current_user, name='current_user'),
    # Add more routes: forgot-password, reset-password, google, refresh
]
```

Update `backend/config/urls.py`:

```python
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('api/auth/', include('users.urls')),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # ... other urls
]
```

---

## Part 2: Frontend Setup

### Step 2.1: Create Authentication Service

Create `frontend/src/services/authService.js`:

```javascript
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Configure axios to send cookies
axios.defaults.withCredentials = true;

export const authService = {
  signup: async (email, password, firstName, lastName) => {
    const response = await axios.post(`${API_BASE}/auth/signup/`, {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_BASE}/auth/login/`, {
      email,
      password,
    });
    return response.data;
  },

  logout: async () => {
    await axios.post(`${API_BASE}/auth/logout/`);
  },

  verifyEmail: async (email, code) => {
    const response = await axios.post(`${API_BASE}/auth/verify-email/`, {
      email,
      code,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/me/`);
      return response.data.user;
    } catch (error) {
      return null;
    }
  },
};
```

### Step 2.2: Create useAuthStatus Hook

Update `frontend/src/hooks/useAuthStatus.js`:

```javascript
import { useEffect, useState } from "react";
import { authService } from "../services/authService";

export const useAuthStatus = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };
};
```

### Step 2.3: Create Login Page

Create `frontend/src/pages/Login.jsx`:

```javascript
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await authService.login(email, password);
      navigate("/chat");
    } catch (error) {
      const errData = error.response?.data || { error: "Network error" };
      setErrors({
        general: errData.error,
        ...errData.details,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="max-w-md w-full bg-surface rounded-lg p-8 border border-border">
        <h1 className="text-2xl font-bold text-paper mb-6">
          {t("auth.login")}
        </h1>

        {errors.general && (
          <div className="mb-4 p-3 bg-spark/20 text-spark rounded text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-paper text-sm mb-2">
              {t("form.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-ink border border-border rounded text-paper"
              required
            />
            {errors.email && (
              <p className="text-spark text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-paper text-sm mb-2">
              {t("form.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-ink border border-border rounded text-paper"
              required
            />
            {errors.password && (
              <p className="text-spark text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-volt text-ink font-bold py-2 rounded hover:bg-volt/80 transition disabled:opacity-50"
          >
            {loading ? t("auth.logging_in") : t("auth.login")}
          </button>
        </form>

        <p className="text-muted text-sm mt-4 text-center">
          {t("auth.no_account")}{" "}
          <Link to="/signup" className="text-volt hover:underline">
            {t("auth.signup")}
          </Link>
        </p>
      </div>
    </div>
  );
};
```

### Step 2.4: Create Signup Page

Create `frontend/src/pages/Signup.jsx` (similar structure to Login)

### Step 2.5: Create Protected Route Component

Create `frontend/src/components/auth/ProtectedRoute.jsx`:

```javascript
import { Navigate } from "react-router-dom";
import { useAuthStatus } from "../../hooks/useAuthStatus";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStatus();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};
```

### Step 2.6: Update App Routing

Update `frontend/src/App.jsx`:

```javascript
import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Chat } from "./pages/Chat";
import { Landing } from "./pages/Landing";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

---

## Part 3: Email Templates

Create `backend/users/emails/`:

```
users/emails/
├── verify_email.html
├── verify_email.ar.html
├── reset_password.html
└── reset_password.ar.html
```

Example `verify_email.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <h1>Verify Your Email</h1>
    <p>Hi {{ first_name }},</p>
    <p>Your verification code is:</p>
    <h2 style="color: #C8FF00; font-size: 32px; letter-spacing: 2px;">
      {{ code }}
    </h2>
    <p>This code expires in 10 minutes.</p>
    <p>Never share this code with anyone.</p>
  </body>
</html>
```

---

## Part 4: Testing

### Backend Tests

Create `backend/users/tests/test_signup.py`:

```python
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User

class SignupTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_success(self):
        response = self.client.post('/api/auth/signup/', {
            'email': 'test@example.com',
            'password': 'SecurePass123',
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_signup_duplicate_email(self):
        User.objects.create_user(email='test@example.com', password='pass', username='test')
        response = self.client.post('/api/auth/signup/', {
            'email': 'test@example.com',
            'password': 'SecurePass123',
        })
        self.assertEqual(response.status_code, 400)
```

Run tests:

```bash
python manage.py test users.tests
```

### Frontend Tests

Create `frontend/src/pages/Login.test.jsx` using Jest/React Testing Library

Run tests:

```bash
npm test
```

---

## Part 5: Deployment Checklist

- [ ] Configure SMTP/SendGrid/SES in production environment
- [ ] Set SECURE_COOKIE_SECURE = True in production settings
- [ ] Update CORS_ALLOWED_ORIGINS with production domain
- [ ] Set GOOGLE_OAUTH_CLIENT_ID and SECRET in production
- [ ] Run database migrations on production
- [ ] Set up HTTPS certificate
- [ ] Create .env.production with production secrets
- [ ] Test end-to-end auth flow in staging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure backups for SQLite (or use PostgreSQL)

---

## Implementation Order

**Recommended sequence** (to enable incremental testing):

1. Django configuration + models + migrations
2. Serializers + Login/Signup views
3. Frontend auth service + useAuthStatus hook
4. Login/Signup page components
5. Email integration + verification flow
6. Password reset flow
7. Google OAuth integration
8. Protected routes + navigation
9. Comprehensive testing
10. Deployment

---

## References

- [Full Specification](./spec.md)
- [Data Model Details](./data-model.md)
- [API Endpoint Contracts](./contracts/auth-endpoints.md)
- [Error Response Format](./contracts/error-responses.md)
- [Phase 0: Research Findings](./research.md)

---

## Support & Questions

For technical questions:

- Check [FAQ section] (TBD Phase 4)
- Search existing GitHub issues
- Create new issue with PR template

---

→ **Quickstart Complete** ✅

**Next**: Run `/speckit.tasks` to generate actionable implementation tasks
