"""
Tests for Google OAuth authentication and account merging.

Coverage:
- Valid OAuth token creates user (201, auto-creates account)
- Existing user signs in via OAuth (200, returns tokens)
- Account merging (email/password user + Google login = same account)
- Invalid token handling (GOOGLE_AUTH_FAILED error)
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
import json


class GoogleOAuthTestCase(TestCase):
	"""Test Google OAuth authentication endpoint with account merging (Q1)."""

	def setUp(self):
		self.client = Client()
		self.google_url = reverse('users:google-oauth')

	@patch('users.utils.verify_google_token')
	def test_valid_oauth_token_creates_user(self, mock_verify):
		"""Test: Valid Google token creates new user (201, account auto-created)."""
		# Mock Google token verification
		mock_verify.return_value = {
			'email': 'google@example.com',
			'name': 'Google User',
			'picture_url': 'https://example.com/pic.jpg',
			'email_verified': True,
		}

		# Send Google login request
		data = json.dumps({'id_token': 'fake_google_token'})
		response = self.client.post(
			self.google_url,
			data=data,
			content_type='application/json'
		)

		# Verify response
		self.assertEqual(response.status_code, 201)
		response_data = response.json()
		self.assertIn('user', response_data)
		self.assertEqual(response_data['user']['email'], 'google@example.com')

		# Verify user created
		user = User.objects.get(email='google@example.com')
		self.assertEqual(user.first_name, 'Google')
		self.assertEqual(user.extension.auth_provider, 'google')
		self.assertTrue(user.extension.is_verified)

	@patch('users.utils.verify_google_token')
	def test_existing_user_google_login(self, mock_verify):
		"""Test: Existing user signs in via Google (200, returns tokens)."""
		# Create existing user
		user = User.objects.create_user(
			username='existing@example.com',
			email='existing@example.com',
			password='TestPass123!'
		)

		# Mock Google token verification with same email
		mock_verify.return_value = {
			'email': 'existing@example.com',
			'name': 'Existing User',
			'picture_url': 'https://example.com/pic.jpg',
			'email_verified': True,
		}

		# Send Google login request
		data = json.dumps({'id_token': 'fake_google_token'})
		response = self.client.post(
			self.google_url,
			data=data,
			content_type='application/json'
		)

		# Verify response (200, not 201, because user already exists)
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertIn('user', response_data)
		self.assertEqual(response_data['user']['email'], 'existing@example.com')

		# Verify user has Google auth provider
		user.refresh_from_db()
		self.assertEqual(user.extension.auth_provider, 'google')

	@patch('users.utils.verify_google_token')
	def test_account_merge_email_password_to_google(self, mock_verify):
		"""
		Test: Account merging - email/password user + Google login = same account.
		
		[CLARIFICATION Q1] When user has email/password account but logs in via Google 
		with same email: Account should merge (not duplicate). User receives tokens. 
		Auth provider updated to 'google'.
		"""
		# Create email/password user
		original_user = User.objects.create_user(
			username='merge@example.com',
			email='merge@example.com',
			password='TestPass123!'
		)
		original_user_id = original_user.id

		# Mock Google token verification with same email
		mock_verify.return_value = {
			'email': 'merge@example.com',
			'name': 'Merged User',
			'picture_url': 'https://example.com/pic.jpg',
			'email_verified': True,
		}

		# Send Google login request
		data = json.dumps({'id_token': 'fake_google_token'})
		response = self.client.post(
			self.google_url,
			data=data,
			content_type='application/json'
		)

		# Verify response
		self.assertEqual(response.status_code, 200)
		response_data = response.json()

		# Verify same user (not duplicate)
		self.assertEqual(response_data['user']['id'], original_user_id)
		self.assertEqual(response_data['user']['email'], 'merge@example.com')

		# Verify only one user with this email
		user_count = User.objects.filter(email='merge@example.com').count()
		self.assertEqual(user_count, 1)

		# Verify auth provider updated to Google
		user = User.objects.get(id=original_user_id)
		self.assertEqual(user.extension.auth_provider, 'google')
		self.assertTrue(user.extension.is_verified)

	@patch('users.utils.verify_google_token')
	def test_invalid_google_token_fails(self, mock_verify):
		"""Test: Invalid Google token fails (GOOGLE_AUTH_FAILED error)."""
		# Mock Google token verification failure
		mock_verify.side_effect = ValueError('Invalid token signature')

		# Send Google login request with bad token
		data = json.dumps({'id_token': 'invalid_token'})
		response = self.client.post(
			self.google_url,
			data=data,
			content_type='application/json'
		)

		# Verify error response
		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertEqual(response_data['code'], 'GOOGLE_AUTH_FAILED')

	def test_missing_id_token(self):
		"""Test: Missing id_token returns INVALID_TOKEN error."""
		# Send request without id_token
		data = json.dumps({})
		response = self.client.post(
			self.google_url,
			data=data,
			content_type='application/json'
		)

		# Verify error response
		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertEqual(response_data['code'], 'INVALID_TOKEN')

	@patch('users.utils.verify_google_token')
	def test_duplicate_google_auth_same_account(self, mock_verify):
		"""Test: Second login with same Google account doesn't create duplicate."""
		# First login - create account
		mock_verify.return_value = {
			'email': 'duplicate@example.com',
			'name': 'Duplicate User',
			'picture_url': 'https://example.com/pic.jpg',
			'email_verified': True,
		}

		data = json.dumps({'id_token': 'fake_google_token'})
		response1 = self.client.post(
			self.google_url,
			data=data,
			content_type='application/json'
		)
		self.assertEqual(response1.status_code, 201)
		first_user_id = response1.json()['user']['id']

		# Second login - same account
		response2 = self.client.post(
			self.google_url,
			data=data,
			content_type='application/json'
		)
		self.assertEqual(response2.status_code, 200)  # Already exists
		second_user_id = response2.json()['user']['id']

		# Verify same user
		self.assertEqual(first_user_id, second_user_id)

		# Verify no duplicates created
		user_count = User.objects.filter(email='duplicate@example.com').count()
		self.assertEqual(user_count, 1)
