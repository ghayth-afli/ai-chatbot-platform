"""
Authentication views for user signup, login, email verification, and password reset.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as http_status
from django.contrib.auth.models import User
from django.db.models import Q
from .models import UserExtension
from .serializers import (
	UserSerializer, SignupSerializer, LoginSerializer,
	PasswordResetSerializer, NewPasswordSerializer,
	VerificationCodeSerializer
)
from .utils import (
	generate_verification_code, generate_reset_code,
	verify_code, send_verification_email, send_password_reset_email,
	get_tokens_for_user, set_auth_cookies, clear_auth_cookies,
	verify_google_token
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.exceptions import get_error_response
from api.throttles import LoginAttemptThrottle, VerificationCodeThrottle, ResendCodeThrottle


class SignupView(APIView):
	"""Endpoint for user account signup with email verification."""
	
	permission_classes = [AllowAny]
	
	def post(self, request):
		serializer = SignupSerializer(data=request.data)
		
		if not serializer.is_valid():
			response_data = get_error_response('VALIDATION_ERROR', {'errors': serializer.errors})
			return Response(response_data, status=http_status.HTTP_400_BAD_REQUEST)
		
		# Create user
		user = serializer.save()
		user.extension.auth_provider = 'email'
		user.extension.save()
		
		# Generate and send verification code
		code = generate_verification_code(user, code_type='verify')
		lang = request.data.get('language', 'en')
		success, error = send_verification_email(user, code, lang)
		
		if not success:
			response_data = get_error_response('EMAIL_SERVICE_ERROR', {'error': error})
			return Response(response_data, status=http_status.HTTP_500_INTERNAL_SERVER_ERROR)
		
		return Response(
			{
				'message': 'Signup successful. Check your email for verification code.',
				'user': UserSerializer(user).data
			},
			status=http_status.HTTP_201_CREATED
		)


class VerifyEmailView(APIView):
	"""Endpoint for email verification using code."""
	
	permission_classes = [AllowAny]
	
	def post(self, request):
		serializer = VerificationCodeSerializer(data=request.data)
		
		if not serializer.is_valid():
			response_data = get_error_response('VALIDATION_ERROR', serializer.errors)
			return Response(response_data, status=http_status.HTTP_400_BAD_REQUEST)
		
		# Get user from email in request
		email = request.data.get('email')
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			response_data = get_error_response('USER_NOT_FOUND')
			return Response(response_data, status=http_status.HTTP_404_NOT_FOUND)
		
		# Verify code
		is_valid, error = verify_code(user, serializer.data['code'], code_type='verify')
		
		if not is_valid:
			response_data = get_error_response(error or 'INVALID_CODE')
			return Response(response_data, status=http_status.HTTP_400_BAD_REQUEST)
		
		# Mark user as verified
		user.extension.is_verified = True
		user.extension.save()
		
		return Response(
			{
				'message': 'Email verified successfully',
				'user': UserSerializer(user).data
			},
			status=http_status.HTTP_200_OK
		)


class LoginView(APIView):
	"""Endpoint for email/password login with HTTP-only cookies."""
	
	permission_classes = [AllowAny]
	throttle_classes = [LoginAttemptThrottle]
	
	def post(self, request):
		serializer = LoginSerializer(data=request.data)
		
		if not serializer.is_valid():
			error_list = list(serializer.errors.values())[0] if serializer.errors else []
			error_msg = str(error_list[0]) if error_list else 'INVALID_CREDENTIALS'
			
			if 'USER_NOT_VERIFIED' in str(error_msg):
				response_data = get_error_response('USER_NOT_VERIFIED')
			else:
				response_data = get_error_response('INVALID_CREDENTIALS')
			
			return Response(response_data, status=http_status.HTTP_401_UNAUTHORIZED)
		
		user = serializer.validated_data['user']
		
		# Generate tokens
		tokens = get_tokens_for_user(user)
		
		# Create response with user data
		response_data = {
			'message': 'Login successful',
			'user': UserSerializer(user).data,
		}
		response = Response(response_data, status=http_status.HTTP_200_OK)
		
		# Set auth cookies
		response = set_auth_cookies(response, tokens['access_token'], tokens['refresh_token'])
		
		return response


class LogoutView(APIView):
	"""Endpoint to clear authentication cookies and logout user."""
	
	permission_classes = [IsAuthenticated]
	
	def post(self, request):
		response = Response({'message': 'Logged out successfully'}, status=http_status.HTTP_204_NO_CONTENT)
		response = clear_auth_cookies(response)
		return response


class ForgotPasswordView(APIView):
	"""Endpoint to request password reset code via email."""
	
	permission_classes = [AllowAny]
	throttle_classes = [VerificationCodeThrottle]
	
	def post(self, request):
		serializer = PasswordResetSerializer(data=request.data)
		
		if not serializer.is_valid():
			response_data = get_error_response('USER_NOT_FOUND')
			return Response(response_data, status=http_status.HTTP_404_NOT_FOUND)
		
		email = serializer.data['email']
		user = User.objects.get(email=email)
		
		# Generate and send reset code
		code = generate_reset_code(user)
		lang = request.data.get('language', 'en')
		success, error = send_password_reset_email(user, code, lang)
		
		if not success:
			response_data = get_error_response('EMAIL_SERVICE_ERROR')
			return Response(response_data, status=http_status.HTTP_500_INTERNAL_SERVER_ERROR)
		
		return Response(
			{'message': 'Reset code sent to email'},
			status=http_status.HTTP_200_OK
		)


class ResetPasswordView(APIView):
	"""Endpoint to reset password using verification code."""
	
	permission_classes = [AllowAny]
	
	def post(self, request):
		serializer = NewPasswordSerializer(data=request.data)
		
		if not serializer.is_valid():
			response_data = get_error_response('PASSWORD_INVALID')
			return Response(response_data, status=http_status.HTTP_400_BAD_REQUEST)
		
		# Get user from email
		email = request.data.get('email')
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			response_data = get_error_response('USER_NOT_FOUND')
			return Response(response_data, status=http_status.HTTP_404_NOT_FOUND)
		
		# Verify code
		is_valid, error = verify_code(user, serializer.validated_data['code'], code_type='reset')
		
		if not is_valid:
			response_data = get_error_response(error or 'INVALID_CODE')
			return Response(response_data, status=http_status.HTTP_400_BAD_REQUEST)
		
		# Update password
		user.set_password(serializer.validated_data['new_password'])
		user.save()
		
		return Response(
			{'message': 'Password reset successfully'},
			status=http_status.HTTP_200_OK
		)


class ResendCodeView(APIView):
	"""Endpoint to resend verification code."""
	
	permission_classes = [AllowAny]
	throttle_classes = [ResendCodeThrottle]
	
	def post(self, request):
		email = request.data.get('email')
		code_type = request.data.get('code_type', 'verify')
		
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			response_data = get_error_response('USER_NOT_FOUND')
			return Response(response_data, status=http_status.HTTP_404_NOT_FOUND)
		
		# Check if user is already verified (for verify code only)
		if code_type == 'verify' and user.extension.is_verified:
			response_data = get_error_response('USER_ALREADY_VERIFIED')
			return Response(response_data, status=http_status.HTTP_400_BAD_REQUEST)
		
		# Generate and send code
		if code_type == 'reset':
			code = generate_reset_code(user)
			lang = request.data.get('language', 'en')
			success, error = send_password_reset_email(user, code, lang)
		else:
			code = generate_verification_code(user, code_type='verify')
			lang = request.data.get('language', 'en')
			success, error = send_verification_email(user, code, lang)
		
		if not success:
			response_data = get_error_response('EMAIL_SERVICE_ERROR')
			return Response(response_data, status=http_status.HTTP_500_INTERNAL_SERVER_ERROR)
		
		return Response(
			{'message': 'Code resent to email'},
			status=http_status.HTTP_200_OK
		)


class MeView(APIView):
	"""Endpoint to retrieve current authenticated user info."""
	
	permission_classes = [IsAuthenticated]
	
	def get(self, request):
		# Ensure user is authenticated (should be enforced by permission_classes)
		if not request.user or not request.user.is_authenticated:
			response_data = get_error_response('UNAUTHORIZED', {'detail': 'Authentication required'})
			return Response(response_data, status=http_status.HTTP_401_UNAUTHORIZED)
		
		serializer = UserSerializer(request.user)
		return Response(serializer.data, status=http_status.HTTP_200_OK)


class GoogleOAuthView(APIView):
	"""Endpoint for Google OAuth authentication with account merging."""
	
	permission_classes = [AllowAny]
	
	def post(self, request):
		id_token = request.data.get('id_token')
		
		if not id_token:
			response_data = get_error_response('INVALID_TOKEN')
			return Response(response_data, status=http_status.HTTP_400_BAD_REQUEST)
		
		try:
			# Verify Google token
			token_info = verify_google_token(id_token)
		except ValueError:
			response_data = get_error_response('GOOGLE_AUTH_FAILED')
			return Response(response_data, status=http_status.HTTP_400_BAD_REQUEST)
		
		email = token_info.get('email')
		name = token_info.get('name', '')
		picture_url = token_info.get('picture_url')
		
		# [CLARIFICATION Q1] Lookup by email first to support account merging
		user, created = User.objects.get_or_create(
			email=email,
			defaults={
				'username': email,
				'first_name': name.split()[0] if name else '',
				'last_name': name.split()[-1] if name and len(name.split()) > 1 else '',
			}
		)
		
		# Update or create extension
		if hasattr(user, 'extension'):
			user.extension.auth_provider = 'google'
			user.extension.profile_picture_url = picture_url
			user.extension.is_verified = True
			user.extension.save()
		else:
			UserExtension.objects.create(
				user=user,
				auth_provider='google',
				profile_picture_url=picture_url,
				is_verified=True
			)
		
		# Generate tokens
		tokens = get_tokens_for_user(user)
		
		# Create response
		response_data = {
			'message': 'Google login successful',
			'user': UserSerializer(user).data,
		}
		response = Response(response_data, status=http_status.HTTP_201_CREATED if created else http_status.HTTP_200_OK)
		
		# Set auth cookies
		response = set_auth_cookies(response, tokens['access_token'], tokens['refresh_token'])
		
		return response

