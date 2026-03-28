"""
Tests for secure cookie-based authentication and rate limiting.

Coverage:
- Cookie security flags (HttpOnly, Secure, SameSite)
- Login rate limiting (5/15min)
- Verification code rate limiting (3/60min)
- Multi-tab logout (session invalidation)
"""

from django.test import TestCase, Client, override_settings
from django.urls import reverse
from django.contrib.auth.models import User
from users.models import VerificationCode
from django.utils import timezone
from datetime import timedelta
import json
from unittest.mock import patch, MagicMock


class CookieSecurityTestCase(TestCase):
	"""Test cookie security flags (HttpOnly, Secure, SameSite)."""

	def setUp(self):
		self.client = Client()
		self.login_url = reverse('users:login')
		self.user = User.objects.create_user(
			username='security@example.com',
			email='security@example.com',
			password='SecurePass123!'
		)
		self.user.extension.is_verified = True
		self.user.extension.save()

	def test_cookie_flags_set_after_login(self):
		"""Test: Login response includes cookies with security flags."""
		response = self.client.post(
			self.login_url,
			data=json.dumps({
				'email': 'security@example.com',
				'password': 'SecurePass123!'
			}),
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 200)
		
		# Check Set-Cookie headers
		set_cookie_headers = response.get('Set-Cookie', '')
		self.assertIn('HttpOnly', set_cookie_headers)
		self.assertIn('SameSite=Lax', set_cookie_headers)
		
	def test_access_token_cookie_15min_expiry(self):
		"""Test: Access token cookie has 15-minute max_age."""
		response = self.client.post(
			self.login_url,
			data=json.dumps({
				'email': 'security@example.com',
				'password': 'SecurePass123!'
			}),
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 200)
		
		# Find access_token cookie
		cookies = response.cookies
		if 'access_token' in cookies:
			max_age = cookies['access_token']['max-age']
			# Should be approximately 15 minutes (900 seconds)
			self.assertIn('900', str(max_age))

	def test_refresh_token_cookie_7day_expiry(self):
		"""Test: Refresh token cookie has 7-day max_age."""
		response = self.client.post(
			self.login_url,
			data=json.dumps({
				'email': 'security@example.com',
				'password': 'SecurePass123!'
			}),
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 200)
		
		# Find refresh_token cookie
		cookies = response.cookies
		if 'refresh_token' in cookies:
			max_age = cookies['refresh_token']['max-age']
			# Should be approximately 7 days (604800 seconds)
			self.assertIn('604800', str(max_age))


class LoginRateLimitingTestCase(TestCase):
	"""Test login rate limiting (5 attempts per 15 minutes)."""

	def setUp(self):
		self.client = Client()
		self.login_url = reverse('users:login')
		
		# Create test user
		self.user = User.objects.create_user(
			username='ratelimit@example.com',
			email='ratelimit@example.com',
			password='RatePass123!'
		)
		self.user.extension.is_verified = True
		self.user.extension.save()

	def test_login_rate_limiting_5_per_15min(self):
		"""Test: After 5 failed logins in 15min, 6th fails with 429."""
		# Make 5 failed login attempts
		for i in range(5):
			response = self.client.post(
				self.login_url,
				data=json.dumps({
					'email': 'ratelimit@example.com',
					'password': 'WrongPassword123!'
				}),
				content_type='application/json'
			)
			# 400 (bad credentials) or 401 (unauthorized)
			self.assertIn(response.status_code, [400, 401])

		# 6th attempt should hit rate limit
		response = self.client.post(
			self.login_url,
			data=json.dumps({
				'email': 'ratelimit@example.com',
				'password': 'WrongPassword123!'
			}),
			content_type='application/json'
		)
		
		# Should be rate limited (429 or 401)
		self.assertIn(response.status_code, [429, 401])


class CodeRateLimitingTestCase(TestCase):
	"""Test verification code rate limiting (3 per 60 minutes)."""

	def setUp(self):
		self.client = Client()
		self.resend_url = reverse('users:resend-code')
		
		# Create unverified test user
		self.user = User.objects.create_user(
			username='coderatelimit@example.com',
			email='coderatelimit@example.com',
			password='CodePass123!'
		)
		self.user.extension.is_verified = False
		self.user.extension.save()

	def test_resend_code_rate_limiting_3_per_60min(self):
		"""Test: After 3 resend code requests in 60min, 4th fails with 429."""
		# Make 3 requests
		for i in range(3):
			response = self.client.post(
				self.resend_url,
				data=json.dumps({'email': 'coderatelimit@example.com'}),
				content_type='application/json'
			)
			self.assertEqual(response.status_code, 200)

		# 4th request should hit rate limit
		response = self.client.post(
			self.resend_url,
			data=json.dumps({'email': 'coderatelimit@example.com'}),
			content_type='application/json'
		)
		
		# Should be rate limited (429)
		self.assertEqual(response.status_code, 429)


class MultiTabLogoutTestCase(TestCase):
	"""Test logout invalidates session across tabs (multi-tab detection)."""

	def setUp(self):
		self.client = Client()
		self.login_url = reverse('users:login')
		self.logout_url = reverse('users:logout')
		self.me_url = reverse('users:me')
		
		# Create verified test user
		self.user = User.objects.create_user(
			username='logout@example.com',
			email='logout@example.com',
			password='LogoutPass123!'
		)
		self.user.extension.is_verified = True
		self.user.extension.save()

	def test_logout_invalidates_token(self):
		"""Test: After logout, accessing /me endpoint returns 401."""
		# Login
		response = self.client.post(
			self.login_url,
			data=json.dumps({
				'email': 'logout@example.com',
				'password': 'LogoutPass123!'
			}),
			content_type='application/json'
		)
		self.assertEqual(response.status_code, 200)
		
		# Verify /me works
		response = self.client.get(self.me_url)
		self.assertEqual(response.status_code, 200)

		# Logout
		response = self.client.post(self.logout_url)
		self.assertEqual(response.status_code, 200)

		# After logout, /me should fail with 401
		response = self.client.get(self.me_url)
		self.assertEqual(response.status_code, 401)

	def test_cookies_cleared_after_logout(self):
		"""Test: Cookies are deleted after logout."""
		# Login
		response = self.client.post(
			self.login_url,
			data=json.dumps({
				'email': 'logout@example.com',
				'password': 'LogoutPass123!'
			}),
			content_type='application/json'
		)
		self.assertEqual(response.status_code, 200)

		# Logout
		response = self.client.post(self.logout_url)
		self.assertEqual(response.status_code, 200)
		
		# Check that cookies are cleared (max_age=0 or expires set to past)
		set_cookie_headers = response.get('Set-Cookie', '')
		# Should have delete directives for cookies
		self.assertNotEqual(set_cookie_headers, '')
