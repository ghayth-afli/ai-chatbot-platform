"""
Custom throttling classes for rate limiting authentication endpoints.

Implements:
- LoginAttemptThrottle: 5 login attempts per 15 minutes per IP
- VerificationCodeThrottle: 3 code resend requests per 60 minutes per email
"""

from rest_framework.throttling import SimpleRateThrottle
from django.core.cache import cache


class LoginAttemptThrottle(SimpleRateThrottle):
	"""
	Rate limiting for login attempts.
	
	Limits: 5 attempts per 15 minutes per IP address
	"""
	scope = 'login_attempts'
	
	def get_cache_key(self, request, view):
		"""Use IP address as cache key for login attempts."""
		if request.user and request.user.is_authenticated:
			return None  # Don't throttle authenticated users
		
		return f'login_attempt_{self.get_ident(request)}'


class VerificationCodeThrottle(SimpleRateThrottle):
	"""
	Rate limiting for verification code requests.
	
	Limits: 3 requests per 60 minutes per email
	"""
	scope = 'verification_code'
	
	def get_cache_key(self, request, view):
		"""Use email address as cache key for code requests."""
		email = request.data.get('email')
		if not email:
			return None
		
		return f'verification_code_{email}'


class ResendCodeThrottle(SimpleRateThrottle):
	"""
	Rate limiting for resend code endpoint.
	
	Limits: 3 requests per 60 minutes per email
	"""
	scope = 'verification_code'
	
	def get_cache_key(self, request, view):
		"""Use email address as cache key for resend requests."""
		email = request.data.get('email')
		if not email:
			return None
		
		return f'resend_code_{email}'
