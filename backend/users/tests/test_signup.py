"""
Test suite for user signup functionality.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from users.models import VerificationCode, UserExtension


class SignupTestCase(TestCase):
	"""Test signup endpoint with valid/invalid inputs."""
	
	def setUp(self):
		self.client = APIClient()
		self.signup_url = '/api/auth/signup/'
	
	def test_valid_signup(self):
		"""Test valid signup creates user and sends email."""
		data = {
			'email': 'newuser@example.com',
			'password': 'SecurePass123!',
			'password_confirm': 'SecurePass123!',
			'first_name': 'John',
			'last_name': 'Doe',
		}
		response = self.client.post(self.signup_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertIn('user', response.data)
		self.assertEqual(response.data['user']['email'], 'newuser@example.com')
		
		# Verify user created
		user = User.objects.get(email='newuser@example.com')
		self.assertIsNotNone(user)
		self.assertFalse(user.extension.is_verified)
	
	def test_duplicate_email(self):
		"""Test signup with existing email returns EMAIL_EXISTS error."""
		# Create existing user
		User.objects.create_user('test@example.com', 'test@example.com', 'password123')
		
		data = {
			'email': 'test@example.com',
			'password': 'SecurePass123!',
			'password_confirm': 'SecurePass123!',
			'first_name': 'Jane',
			'last_name': 'Doe',
		}
		response = self.client.post(self.signup_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
	
	def test_weak_password(self):
		"""Test signup with weak password returns PASSWORD_INVALID error."""
		data = {
			'email': 'weak@example.com',
			'password': 'weak',
			'password_confirm': 'weak',
			'first_name': 'Weak',
			'last_name': 'Pass',
		}
		response = self.client.post(self.signup_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
	
	def test_password_mismatch(self):
		"""Test signup with mismatched passwords."""
		data = {
			'email': 'mismatch@example.com',
			'password': 'SecurePass123!',
			'password_confirm': 'DifferentPass456!',
			'first_name': 'Mismatch',
			'last_name': 'User',
		}
		response = self.client.post(self.signup_url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
