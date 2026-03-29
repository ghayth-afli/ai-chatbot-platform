"""
URL routing for authentication endpoints.

Maps the following endpoints:
- POST /api/auth/signup - User signup
- POST /api/auth/verify-email - Email verification
- POST /api/auth/login - Email/password login
- POST /api/auth/logout - Logout and clear cookies
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password with code
- POST /api/auth/resend-code - Resend verification code
- POST /api/auth/google - Google OAuth login
- GET /api/auth/me - Get current user info
"""

from django.urls import path
from .views import (
	SignupView, VerifyEmailView, LoginView, LogoutView,
	ForgotPasswordView, ResetPasswordView, ResendCodeView,
	MeView, GoogleOAuthView, RefreshTokenView
)

app_name = 'users'

urlpatterns = [
	path('signup/', SignupView.as_view(), name='signup'),
	path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
	path('login/', LoginView.as_view(), name='login'),
	path('logout/', LogoutView.as_view(), name='logout'),
	path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
	path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
	path('resend-code/', ResendCodeView.as_view(), name='resend-code'),
	path('google/', GoogleOAuthView.as_view(), name='google-oauth'),
	path('refresh/', RefreshTokenView.as_view(), name='refresh'),
	path('me/', MeView.as_view(), name='me'),
]
