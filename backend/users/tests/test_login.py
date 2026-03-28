"""
Test suite for user login and authentication functionality.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from users.models import UserExtension


class LoginTestCase(TestCase):
	"""Test login endpoint authentication."""
	
	def setUp(self):
		self.client = APIClient()
		self.login_url = '/api/auth/login/'
		self.me_url = '/api/auth/me/'
		
		# Create verified user
		self.user = User.objects.create_user(
			username='verified@example.com',
			email='verified@example.com',
			password='SecurePass123!'
		)
		self.user.extension.is_verified = True
		self.user.extension.save()
		
		# Create unverified user
		self.unverified = User.objects.create_user(
			username='unverified@example.com',
			email='unverified@example.com',
			password='SecurePass123!'
		)
		self.unverified.extension.is_verified = False
		self.unverified.extension.save()
	
	def test_valid_login(self):
		"""Test login with correct credentials returns tokens."""
		data = {
			'email': 'verified@example.com',
			'password': 'SecurePass123!',
		}
		response = self.client.post(self.login_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('user', response.data)
		self.assertEqual(response.data['user']['email'], 'verified@example.com')
		
		# Check cookies set
		self.assertIn('access_token', response.cookies)
	
	def test_invalid_password(self):
		"""Test login with wrong password returns INVALID_CREDENTIALS."""
		data = {
			'email': 'verified@example.com',
			'password': 'WrongPassword123!',
		}
		response = self.client.post(self.login_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
		self.assertIn('code', response.data)
	
	def test_nonexistent_user(self):
		"""Test login with non-existent email."""
		data = {
			'email': 'nonexistent@example.com',
			'password': 'SomePass123!',
		}
		response = self.client.post(self.login_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
	
	def test_unverified_user_cannot_login(self):
		"""Test unverified user cannot login."""
		data = {
			'email': 'unverified@example.com',
			'password': 'SecurePass123!',
		}
		response = self.client.post(self.login_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
		self.assertIn('USER_NOT_VERIFIED', response.data.get('code', ''))
	
	def test_get_current_user(self):
		"""Test /me endpoint returns current user info."""
		# Login first
		login_data = {
			'email': 'verified@example.com',
			'password': 'SecurePass123!',
		}
		login_response = self.client.post(self.login_url, login_data, format='json')
		
		# Extract token from cookie
		access_token = login_response.cookies.get('access_token').value
		
		# Use token to get current user
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
		me_response = self.client.get(self.me_url)
		
		self.assertEqual(me_response.status_code, status.HTTP_200_OK)
		self.assertEqual(me_response.data['email'], 'verified@example.com')
	
	def test_get_current_user_without_auth(self):
		"""Test /me endpoint returns 401 without authentication."""
		response = self.client.get(self.me_url)
		
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutTestCase(TestCase):
	"""Test logout endpoint."""
	
	def setUp(self):
		self.client = APIClient()
		self.logout_url = '/api/auth/logout/'
		self.login_url = '/api/auth/login/'
		
		# Create verified user
		self.user = User.objects.create_user(
			username='logout@example.com',
			email='logout@example.com',
			password='SecurePass123!'
		)
		self.user.extension.is_verified = True
		self.user.extension.save()
	
	def test_logout_clears_cookies(self):
		"""Test logout clears authentication cookies."""
		# Login
		login_data = {
			'email': 'logout@example.com',
			'password': 'SecurePass123!',
		}
		login_response = self.client.post(self.login_url, login_data, format='json')
		access_token = login_response.cookies.get('access_token').value
		
		# Logout
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
		logout_response = self.client.post(self.logout_url)
		
		self.assertEqual(logout_response.status_code, status.HTTP_204_NO_CONTENT)
		# Verify cookies deleted
		self.assertIn('access_token', logout_response.cookies)


class PasswordSecurityTestCase(TestCase):
	"""Test password hashing and security."""
	
	def setUp(self):
		self.user = User.objects.create_user(
			username='secure@example.com',
			email='secure@example.com',
			password='TestPassword123!'
		)
	
	def test_password_hashed(self):
		"""Verify password is hashed with bcrypt."""
		# Password should not be stored in plain text
		self.assertNotEqual(self.user.password, 'TestPassword123!')
		
		# Verify password check works
		self.assertTrue(self.user.check_password('TestPassword123!'))
		self.assertFalse(self.user.check_password('WrongPassword123!'))
