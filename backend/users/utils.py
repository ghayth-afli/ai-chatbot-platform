"""
Utility functions for user authentication, verification codes, email, and JWT tokens.
"""

import random
import string
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .models import VerificationCode, UserExtension


def generate_verification_code(user, code_type='verify'):
	"""
	Generate and store email verification code.
	
	Args:
		user (User): User instance
		code_type (str): 'verify' or 'reset'
		
	Returns:
		str: 6-digit code
	"""
	code = ''.join(random.choices(string.digits, k=6))
	expires_at = timezone.now() + timedelta(minutes=10)
	
	VerificationCode.objects.create(
		user=user,
		code=code,
		type=code_type,
		expires_at=expires_at
	)
	
	return code


def generate_reset_code(user):
	"""
	Generate and store password reset code.
	
	Args:
		user (User): User instance
		
	Returns:
		str: 6-digit code
	"""
	return generate_verification_code(user, code_type='reset')


def verify_code(user, code, code_type='verify'):
	"""
	Validate verification/reset code and mark as used - ATOMIC to prevent race conditions.
	
	Implements atomic database query to prevent race condition when 2 requests submit same code 
	simultaneously. Uses Django ORM update() with F() expressions to check is_used=False BEFORE 
	updating: updated = VerificationCode.objects.filter(...).update(is_used=True). If updated==0, 
	race condition detected, return (False, 'TOKEN_ALREADY_USED').
	
	[CLARIFICATION Q4] Atomic operation prevents concurrent code submissions from different tabs.
	
	Args:
		user (User): User instance
		code (str): Code to verify
		code_type (str): 'verify' or 'reset'
		
	Returns:
		tuple: (is_valid: bool, error_message: str or None)
	"""
	try:
		# Find the verification code
		vc = VerificationCode.objects.get(
			user=user,
			code=code,
			type=code_type,
			is_used=False
		)
		
		# Check expiration
		if vc.expires_at < timezone.now():
			return (False, 'TOKEN_EXPIRED')
		
		# Atomic update to prevent race conditions
		# Only update if is_used is still False
		updated = VerificationCode.objects.filter(
			id=vc.id,
			is_used=False
		).update(is_used=True)
		
		if updated == 0:
			# Race condition: another request already used this code
			return (False, 'TOKEN_ALREADY_USED')
		
		return (True, None)
		
	except VerificationCode.DoesNotExist:
		return (False, 'INVALID_CODE')
	except Exception as e:
		return (False, 'INTERNAL_ERROR')


def send_email(email, template_name, context, subject=''):
	"""
	Generic email sending utility with template rendering.
	
	Args:
		email (str): Recipient email
		template_name (str): Template file name (e.g., 'verify_email.html')
		context (dict): Template context variables
		subject (str): Email subject
		
	Returns:
		tuple: (success: bool, error_message: str or None)
	"""
	try:
		# Render template
		html_content = render_to_string(f'emails/{template_name}', context)
		
		# Send email
		send_mail(
			subject=subject,
			message='',
			from_email=settings.DEFAULT_FROM_EMAIL,
			recipient_list=[email],
			html_message=html_content,
			fail_silently=False,
		)
		
		return (True, None)
		
	except Exception as e:
		return (False, str(e))


def send_verification_email(user, code, language='en'):
	"""
	Send email verification code.
	
	Args:
		user (User): User instance
		code (str): Verification code
		language (str): 'en' or 'ar'
		
	Returns:
		tuple: (success: bool, error_message: str or None)
	"""
	context = {
		'email': user.email,
		'code': code,
		'language': language,
		'expiry_minutes': 10,
	}
	
	subject = 'Verify your email' if language == 'en' else 'تحقق من بريدك الإلكتروني'
	template = f'verify_email.{language}.html' if language != 'en' else 'verify_email.html'
	
	return send_email(user.email, template, context, subject)


def send_password_reset_email(user, code, language='en'):
	"""
	Send password reset code.
	
	Args:
		user (User): User instance
		code (str): Reset code
		language (str): 'en' or 'ar'
		
	Returns:
		tuple: (success: bool, error_message: str or None)
	"""
	context = {
		'email': user.email,
		'code': code,
		'language': language,
		'expiry_minutes': 10,
	}
	
	subject = 'Reset your password' if language == 'en' else 'أعد تعيين كلمة المرور'
	template = f'reset_password.{language}.html' if language != 'en' else 'reset_password.html'
	
	return send_email(user.email, template, context, subject)


def get_tokens_for_user(user):
	"""
	Generate access and refresh tokens for user.
	
	Args:
		user (User): User instance
		
	Returns:
		dict: {access_token: str, refresh_token: str}
	"""
	refresh = RefreshToken.for_user(user)
	
	return {
		'access_token': str(refresh.access_token),
		'refresh_token': str(refresh),
	}


def set_auth_cookies(response, access_token, refresh_token):
	"""
	Set HTTP-only authentication cookies with security flags.
	
	Args:
		response: Django HttpResponse object
		access_token (str): JWT access token
		refresh_token (str): JWT refresh token
		
	Returns:
		response: Updated response with cookies set
	"""
	# Access token cookie (15 minutes)
	response.set_cookie(
		key='access_token',
		value=access_token,
		max_age=15 * 60,  # 15 minutes
		httponly=True,
		secure=settings.DEBUG is False,  # True in production
		samesite='Lax',
	)
	
	# Refresh token cookie (7 days)
	response.set_cookie(
		key='refresh_token',
		value=refresh_token,
		max_age=7 * 24 * 60 * 60,  # 7 days
		httponly=True,
		secure=settings.DEBUG is False,  # True in production
		samesite='Lax',
	)
	
	return response


def clear_auth_cookies(response):
	"""
	Clear authentication cookies on logout.
	
	Args:
		response: Django HttpResponse object
		
	Returns:
		response: Updated response with cookies cleared
	"""
	response.delete_cookie('access_token', samesite='Lax')
	response.delete_cookie('refresh_token', samesite='Lax')
	
	return response


def verify_google_token(token):
	"""
	Verify Google OAuth token and extract user info.
	
	In development mode with mock tokens, returns mock user data.
	For production use google-auth library:
	from google.auth.transport import requests
	from google.oauth2 import id_token
	
	Args:
		token (str): Google ID token
		
	Returns:
		dict: Decoded token with {email, name, picture_url} or raises exception
	"""
	# Handle mock token in development
	if token == 'mock-jwt-token-from-google' and settings.DEBUG:
		return {
			'email': 'testuser@example.com',
			'name': 'Test User',
			'picture_url': 'https://lh3.googleusercontent.com/a/default-user',
			'email_verified': True,
		}
	
	try:
		from google.auth.transport import requests
		from google.oauth2 import id_token
		
		# Verify token signature with Google's public keys
		idinfo = id_token.verify_oauth2_token(
			token,
			requests.Request(),
			settings.GOOGLE_OAUTH_CLIENT_ID
		)
		
		# Extract user info
		return {
			'email': idinfo.get('email'),
			'name': idinfo.get('name', ''),
			'picture_url': idinfo.get('picture'),
			'email_verified': idinfo.get('email_verified', False),
		}
		
	except Exception as e:
		raise ValueError(f'Invalid Google token: {str(e)}')
