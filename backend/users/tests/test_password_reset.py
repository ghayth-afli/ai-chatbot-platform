"""
Test suite for password reset functionality.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from users.models import UserExtension, VerificationCode
from django.utils import timezone
from datetime import timedelta


class PasswordResetTestCase(TestCase):
	"""Test password reset endpoints."""
	
	def setUp(self):
		self.client = APIClient()
		self.forgot_password_url = '/api/auth/forgot-password/'
		self.reset_password_url = '/api/auth/reset-password/'
		self.login_url = '/api/auth/login/'
		
		# Create verified user
		self.user = User.objects.create_user(
			username='testuser@example.com',
			email='testuser@example.com',
			password='OldPassword123!'
		)
		self.user.extension.is_verified = True
		self.user.extension.save()
	
	def test_forgot_password_valid_email(self):
		"""Test forgot password with valid email sends reset code."""
		data = {
			'email': 'testuser@example.com',
			'language': 'en'
		}
		response = self.client.post(self.forgot_password_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('message', response.data)
		
		# Verify code created
		reset_code = VerificationCode.objects.filter(
			user=self.user,
			type='reset',
			is_used=False
		).first()
		self.assertIsNotNone(reset_code)
		self.assertEqual(len(reset_code.code), 6)
		self.assertTrue(reset_code.code.isdigit())
	
	def test_forgot_password_nonexistent_user(self):
		"""Test forgot password with non-existent email."""
		data = {
			'email': 'nonexistent@example.com',
			'language': 'en'
		}
		response = self.client.post(self.forgot_password_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
		self.assertIn('code', response.data)
	
	def test_reset_password_valid_code(self):
		"""Test reset password with valid code and new password."""
		# Create reset code
		reset_code = VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='reset',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=False
		)
		
		data = {
			'email': 'testuser@example.com',
			'code': '123456',
			'new_password': 'NewPassword456!',
			'new_password_confirm': 'NewPassword456!'
		}
		response = self.client.post(self.reset_password_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('message', response.data)
		
		# Verify code marked as used
		reset_code.refresh_from_db()
		self.assertTrue(reset_code.is_used)
		
		# Verify password changed - can login with new password
		login_data = {
			'email': 'testuser@example.com',
			'password': 'NewPassword456!'
		}
		login_response = self.client.post(self.login_url, login_data, format='json')
		self.assertEqual(login_response.status_code, status.HTTP_200_OK)
	
	def test_reset_password_invalid_code(self):
		"""Test reset password with invalid code."""
		data = {
			'email': 'testuser@example.com',
			'code': 'invalid',
			'new_password': 'NewPassword456!',
			'new_password_confirm': 'NewPassword456!'
		}
		response = self.client.post(self.reset_password_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('code', response.data)
	
	def test_reset_password_expired_code(self):
		"""Test reset password with expired code."""
		# Create expired code
		VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='reset',
			expires_at=timezone.now() - timedelta(minutes=1),  # Expired
			is_used=False
		)
		
		data = {
			'email': 'testuser@example.com',
			'code': '123456',
			'new_password': 'NewPassword456!',
			'new_password_confirm': 'NewPassword456!'
		}
		response = self.client.post(self.reset_password_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('code', response.data)
	
	def test_reset_password_already_used_code(self):
		"""Test reset password with already-used code."""
		# Create used code
		VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='reset',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=True  # Already used
		)
		
		data = {
			'email': 'testuser@example.com',
			'code': '123456',
			'new_password': 'NewPassword456!',
			'new_password_confirm': 'NewPassword456!'
		}
		response = self.client.post(self.reset_password_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
	
	def test_reset_password_weak_password(self):
		"""Test reset password with weak password."""
		# Create valid code
		VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='reset',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=False
		)
		
		# Try weak password
		data = {
			'email': 'testuser@example.com',
			'code': '123456',
			'new_password': '123',  # Too weak
			'new_password_confirm': '123'
		}
		response = self.client.post(self.reset_password_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
	
	def test_reset_password_mismatch(self):
		"""Test reset password with mismatched passwords."""
		# Create valid code
		VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='reset',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=False
		)
		
		data = {
			'email': 'testuser@example.com',
			'code': '123456',
			'new_password': 'NewPassword456!',
			'new_password_confirm': 'DifferentPassword789!'  # Mismatch
		}
		response = self.client.post(self.reset_password_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
	
	def test_old_password_no_longer_works(self):
		"""Test that old password no longer works after reset."""
		# Create reset code
		reset_code = VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='reset',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=False
		)
		
		# Reset password
		reset_data = {
			'email': 'testuser@example.com',
			'code': '123456',
			'new_password': 'NewPassword456!',
			'new_password_confirm': 'NewPassword456!'
		}
		response = self.client.post(self.reset_password_url, reset_data, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		
		# Try login with old password
		login_data = {
			'email': 'testuser@example.com',
			'password': 'OldPassword123!'
		}
		login_response = self.client.post(self.login_url, login_data, format='json')
		
		self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)
	
	def test_reset_code_same_type_as_verify(self):
		"""Test that reset codes are type='reset' not 'verify'."""
		# Create reset code
		VerificationCode.objects.create(
			user=self.user,
			code='123456',
			type='reset',
			expires_at=timezone.now() + timedelta(minutes=10),
			is_used=False
		)
		
		data = {
			'email': 'testuser@example.com',
			'code': '123456',
			'new_password': 'NewPassword456!',
			'new_password_confirm': 'NewPassword456!'
		}
		response = self.client.post(self.reset_password_url, data, format='json')
		
		# Should work (it's type='reset')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
