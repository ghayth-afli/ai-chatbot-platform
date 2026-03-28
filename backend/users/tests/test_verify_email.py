from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.cache import cache
from users.models import VerificationCode
from django.utils import timezone
from datetime import timedelta
import json


class VerifyEmailTestCase(TestCase):
	"""
	Test email verification endpoint.
	"""

	def setUp(self):
		self.client = Client()
		self.verify_url = reverse('users:verify-email')
		# Create a test user with unverified email
		self.user = User.objects.create_user(
			username='testuser',
			email='test@example.com',
			password='TestPass123!'
		)
		self.user.extension.is_verified = False
		self.user.extension.save()

	def test_valid_code_verifies_user(self):
		"""Test: Valid code verifies user (200, is_verified=true)."""
		# Create a verification code
		code = VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='verify',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=False
		)

		data = json.dumps({'code': '123456', 'email': 'test@example.com'})
		response = self.client.post(
			self.verify_url,
			data=data,
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 200)
		self.user.extension.refresh_from_db()
		self.assertTrue(self.user.extension.is_verified)

	def test_expired_code_fails(self):
		"""Test: Expired code fails (TOKEN_EXPIRED)."""
		# Create an expired verification code
		VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='verify',
			expires_at=timezone.now() - timedelta(minutes=1),
			is_used=False
		)

		data = json.dumps({'code': '123456', 'email': 'test@example.com'})
		response = self.client.post(
			self.verify_url,
			data=data,
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertIn('TOKEN_EXPIRED', response_data.get('code', ''))

	def test_invalid_code_fails(self):
		"""Test: Invalid code fails (INVALID_CODE)."""
		# Create a verification code but use wrong code
		VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='verify',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=False
		)

		data = json.dumps({'code': '999999', 'email': 'test@example.com'})
		response = self.client.post(
			self.verify_url,
			data=data,
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertIn('INVALID_CODE', response_data.get('code', ''))

	def test_already_used_code_fails(self):
		"""Test: Already-used code fails (INVALID_CODE)."""
		# Create a used verification code
		VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='verify',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=True
		)

		data = json.dumps({'code': '123456', 'email': 'test@example.com'})
		response = self.client.post(
			self.verify_url,
			data=data,
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertIn('INVALID_CODE', response_data.get('code', ''))


class ResendCodeTestCase(TestCase):
	"""
	Test resend code endpoint.
	"""

	def setUp(self):
		cache.clear()  # Clear throttle cache before each test
		self.client = Client()
		self.resend_url = reverse('users:resend-code')
		# Create a test user with unverified email
		self.user = User.objects.create_user(
			username='testuser',
			email='test@example.com',
			password='TestPass123!'
		)
		self.user.extension.is_verified = False
		self.user.extension.save()

	def test_resend_creates_new_code(self):
		"""Test: Resend creates new code (200)."""
		data = json.dumps({'email': 'test@example.com'})
		response = self.client.post(
			self.resend_url,
			data=data,
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn('message', response.json())
		# Verify a new code was created
		codes = VerificationCode.objects.filter(user=self.user, type='verify')
		self.assertGreater(codes.count(), 0)

	def test_rate_limiting(self):
		"""Test: Rate limiting (3/60min)."""
		# Make 3 resend requests
		for i in range(3):
			data = json.dumps({'email': 'test@example.com'})
			response = self.client.post(
				self.resend_url,
				data=data,
				content_type='application/json'
			)
			self.assertEqual(response.status_code, 200)

		# Fourth request should be rate limited
		data = json.dumps({'email': 'test@example.com'})
		response = self.client.post(
			self.resend_url,
			data=data,
			content_type='application/json'
		)

		# Should either fail with 429 (rate limited) or return error
		self.assertIn(response.status_code, [429, 400])

	def test_unverified_user_can_resend(self):
		"""Test: Unverified user can resend code."""
		data = json.dumps({'email': 'test@example.com'})
		response = self.client.post(
			self.resend_url,
			data=data,
			content_type='application/json'
		)

		self.assertEqual(response.status_code, 200)

	def test_verified_user_cannot_resend(self):
		"""Test: Verified user cannot request new verification code."""
		self.user.extension.is_verified = True
		self.user.extension.save()

		data = json.dumps({'email': 'test@example.com'})
		response = self.client.post(
			self.resend_url,
			data=data,
			content_type='application/json'
		)

		# Should return error (user already verified)
		self.assertNotEqual(response.status_code, 200)
