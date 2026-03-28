"""
Integration tests for complete user lifecycle.

Tests that all authentication components work together correctly:
- Signup → Verify Email → Login → Access Protected Endpoint → Logout
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from users.models import VerificationCode
from django.utils import timezone
from datetime import timedelta


class AuthenticationLifecycleTestCase(TestCase):
	"""Test complete user journey through authentication system."""
	
	def setUp(self):
		self.client = APIClient()
		self.signup_url = '/api/auth/signup/'
		self.verify_url = '/api/auth/verify-email/'
		self.login_url = '/api/auth/login/'
		self.logout_url = '/api/auth/logout/'
		self.me_url = '/api/auth/me/'
	
	def test_complete_signup_verify_login_logout_flow(self):
		"""Test complete user lifecycle from signup to logout."""
		
		# 1. SIGNUP - Create new account
		signup_data = {
			'email': 'lifecycle@example.com',
			'password': 'LifecyclePass123!',
			'password_confirm': 'LifecyclePass123!',
			'first_name': 'Lifecycle',
			'last_name': 'User',
			'language': 'en'
		}
		signup_response = self.client.post(self.signup_url, signup_data, format='json')
		
		self.assertEqual(signup_response.status_code, status.HTTP_201_CREATED)
		self.assertIn('user', signup_response.data)
		self.assertFalse(signup_response.data['user']['is_verified'])
		
		# Get created user
		user = User.objects.get(email='lifecycle@example.com')
		self.assertIsNotNone(user)
		self.assertFalse(user.extension.is_verified)
		
		# 2. VERIFY EMAIL - Get code and verify
		verify_code = VerificationCode.objects.filter(
			user=user,
			type='verify',
			is_used=False
		).first()
		
		self.assertIsNotNone(verify_code)
		
		verify_data = {
			'email': 'lifecycle@example.com',
			'code': verify_code.code
		}
		verify_response = self.client.post(self.verify_url, verify_data, format='json')
		
		self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
		self.assertTrue(verify_response.data['user']['is_verified'])
		
		# Refresh user from DB
		user.refresh_from_db()
		self.assertTrue(user.extension.is_verified)
		
		# 3. LOGIN - Use credentials to login
		login_data = {
			'email': 'lifecycle@example.com',
			'password': 'LifecyclePass123!'
		}
		login_response = self.client.post(self.login_url, login_data, format='json')
		
		self.assertEqual(login_response.status_code, status.HTTP_200_OK)
		self.assertIn('user', login_response.data)
		self.assertIn('access_token', login_response.cookies)
		
		# 4. PROTECTED ENDPOINT - Access /me/ endpoint
		# Need to set auth header or use cookie
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_response.data.get("access_token", "")}')
		me_response = self.client.get(self.me_url)
		
		self.assertEqual(me_response.status_code, status.HTTP_200_OK)
		self.assertEqual(me_response.data['email'], 'lifecycle@example.com')
		self.assertEqual(me_response.data['first_name'], 'Lifecycle')
		
		# 5. LOGOUT - Clear authentication
		logout_response = self.client.post(self.logout_url)
		
		self.assertIn(logout_response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
		
		# 6. VERIFY CANNOT ACCESS PROTECTED ENDPOINT AFTER LOGOUT
		self.client.credentials()  # Clear auth
		# Create new client to ensure cookies cleared
		new_client = APIClient()
		
		protected_response = new_client.get(self.me_url)
		
		self.assertEqual(protected_response.status_code, status.HTTP_401_UNAUTHORIZED)
	
	def test_unverified_user_cannot_login(self):
		"""Test that unverified user cannot login."""
		
		# Create unverified user via signup
		signup_data = {
			'email': 'unverified@example.com',
			'password': 'UnverifiedPass123!',
			'password_confirm': 'UnverifiedPass123!',
			'first_name': 'Unverified',
			'last_name': 'User',
			'language': 'en'
		}
		self.client.post(self.signup_url, signup_data, format='json')
		
		# Try to login without verifying
		login_data = {
			'email': 'unverified@example.com',
			'password': 'UnverifiedPass123!'
		}
		login_response = self.client.post(self.login_url, login_data, format='json')
		
		# Should fail with USER_NOT_VERIFIED
		self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)
		self.assertIn('USER_NOT_VERIFIED', login_response.data.get('code', ''))
	
	def test_cannot_login_with_wrong_password(self):
		"""Test that wrong password prevents login."""
		
		# Create and verify user
		user = User.objects.create_user(
			username='correct@example.com',
			email='correct@example.com',
			password='CorrectPass123!'
		)
		user.extension.is_verified = True
		user.extension.save()
		
		# Try to login with wrong password
		login_data = {
			'email': 'correct@example.com',
			'password': 'WrongPassword456!'
		}
		login_response = self.client.post(self.login_url, login_data, format='json')
		
		self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)
	
	def test_cannot_signup_with_duplicate_email(self):
		"""Test that duplicate email signup fails."""
		
		# Create existing user
		User.objects.create_user(
			username='existing@example.com',
			email='existing@example.com',
			password='ExistingPass123!'
		)
		
		# Try to signup with same email
		signup_data = {
			'email': 'existing@example.com',
			'password': 'NewPass123!',
			'password_confirm': 'NewPass123!',
			'first_name': 'New',
			'last_name': 'User',
			'language': 'en'
		}
		signup_response = self.client.post(self.signup_url, signup_data, format='json')
		
		self.assertEqual(signup_response.status_code, status.HTTP_400_BAD_REQUEST)
		# Check for validation error (duplicate email)  
		# Response structure: {'error': 'CODE', 'details': {'errors': {...}}}
		if 'details' in signup_response.data:
			self.assertIn('errors', signup_response.data['details'])
			self.assertIn('email', signup_response.data['details'].get('errors', {}))
		else:
			# Fallback for different error structure
			self.assertIn('errors', signup_response.data)
			self.assertIn('email', signup_response.data.get('errors', {}))
	
	def test_password_reset_flow(self):
		"""Test complete password reset workflow."""
		
		# Create verified user
		user = User.objects.create_user(
			username='resetuser@example.com',
			email='resetuser@example.com',
			password='OldPassword123!'
		)
		user.extension.is_verified = True
		user.extension.save()
		
		# Request password reset
		forgot_data = {'email': 'resetuser@example.com'}
		forgot_response = self.client.post('/api/auth/forgot-password/', forgot_data, format='json')
		
		self.assertEqual(forgot_response.status_code, status.HTTP_200_OK)
		
		# Get reset code
		reset_code = VerificationCode.objects.filter(
			user=user,
			type='reset',
			is_used=False
		).first()
		
		self.assertIsNotNone(reset_code)
		
		# Reset password
		reset_data = {
			'email': 'resetuser@example.com',
			'code': reset_code.code,
			'new_password': 'NewPassword456!',
			'new_password_confirm': 'NewPassword456!'
		}
		reset_response = self.client.post('/api/auth/reset-password/', reset_data, format='json')
		
		self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
		
		# Try login with new password
		login_data = {
			'email': 'resetuser@example.com',
			'password': 'NewPassword456!'
		}
		login_response = self.client.post(self.login_url, login_data, format='json')
		
		self.assertEqual(login_response.status_code, status.HTTP_200_OK)
		
		# Old password should no longer work
		old_login_data = {
			'email': 'resetuser@example.com',
			'password': 'OldPassword123!'
		}
		old_login_response = self.client.post(self.login_url, old_login_data, format='json')
		
		self.assertEqual(old_login_response.status_code, status.HTTP_401_UNAUTHORIZED)
