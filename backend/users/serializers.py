"""
Serializers for user authentication and account management.
"""

import re
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserExtension


class UserSerializer(serializers.ModelSerializer):
	"""Serializer for User model representing authenticated user data."""
	
	auth_provider = serializers.CharField(source='extension.auth_provider', read_only=True)
	profile_picture_url = serializers.CharField(source='extension.profile_picture_url', read_only=True)
	is_verified = serializers.BooleanField(source='extension.is_verified', read_only=True)
	
	class Meta:
		model = User
		fields = ['id', 'email', 'first_name', 'last_name', 'auth_provider', 'is_verified', 'profile_picture_url', 'date_joined']


class SignupSerializer(serializers.ModelSerializer):
	"""Serializer validates signup form data and creates User object."""
	
	password_confirm = serializers.CharField(write_only=True, required=True)
	
	class Meta:
		model = User
		fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name']
		extra_kwargs = {
			'password': {'write_only': True},
		}
	
	def validate_email(self, value):
		"""Check email uniqueness and valid format."""
		if User.objects.filter(email=value).exists():
			raise serializers.ValidationError('EMAIL_EXISTS - This email is already registered.')
		
		# Validate email format (basic check)
		if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
			raise serializers.ValidationError('VALIDATION_ERROR - Invalid email format.')
		
		return value
	
	def validate_password(self, value):
		"""Check password meets requirements: min 8 chars, uppercase, digit, special char."""
		if len(value) < 8:
			raise serializers.ValidationError('PASSWORD_INVALID - Password must be at least 8 characters.')
		
		if not re.search(r'[A-Z]', value):
			raise serializers.ValidationError('PASSWORD_INVALID - Password must contain an uppercase letter.')
		
		if not re.search(r'\d', value):
			raise serializers.ValidationError('PASSWORD_INVALID - Password must contain a digit.')
		
		if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
			raise serializers.ValidationError('PASSWORD_INVALID - Password must contain a special character.')
		
		return value
	
	def validate(self, data):
		"""Check password == password_confirm."""
		if data.get('password') != data.get('password_confirm'):
			raise serializers.ValidationError('PASSWORD_INVALID - Passwords do not match.')
		
		return data
	
	def create(self, validated_data):
		"""Create user account."""
		validated_data.pop('password_confirm')
		user = User.objects.create_user(
			username=validated_data['email'],  # Use email as username
			email=validated_data['email'],
			password=validated_data['password'],
			first_name=validated_data.get('first_name', ''),
			last_name=validated_data.get('last_name', ''),
		)
		return user


class LoginSerializer(serializers.Serializer):
	"""Serializer validates login credentials and checks account status."""
	
	email = serializers.EmailField(required=True)
	password = serializers.CharField(write_only=True, required=True)
	
	def validate(self, data):
		"""Check user exists, password correct, email verified."""
		email = data.get('email')
		password = data.get('password')
		
		# Check user exists
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			raise serializers.ValidationError('INVALID_CREDENTIALS - Invalid email or password.')
		
		# Check password
		if not user.check_password(password):
			raise serializers.ValidationError('INVALID_CREDENTIALS - Invalid email or password.')
		
		# Check email verified
		if not user.extension.is_verified and user.extension.auth_provider == 'email':
			raise serializers.ValidationError('USER_NOT_VERIFIED - Please verify your email first.')
		
		data['user'] = user
		return data


class PasswordResetSerializer(serializers.Serializer):
	"""Serializer for password reset request validation."""
	
	email = serializers.EmailField(required=True)
	
	def validate_email(self, value):
		"""Check user exists."""
		if not User.objects.filter(email=value).exists():
			raise serializers.ValidationError('USER_NOT_FOUND - No account found with this email.')
		
		return value


class NewPasswordSerializer(serializers.Serializer):
	"""Serializer for password reset completion with code validation."""
	
	code = serializers.CharField(max_length=6, required=True)
	new_password = serializers.CharField(write_only=True, required=True)
	new_password_confirm = serializers.CharField(write_only=True, required=True)
	
	def validate_new_password(self, value):
		"""Check password meets requirements."""
		if len(value) < 8:
			raise serializers.ValidationError('PASSWORD_INVALID - Password must be at least 8 characters.')
		
		if not re.search(r'[A-Z]', value):
			raise serializers.ValidationError('PASSWORD_INVALID - Password must contain an uppercase letter.')
		
		if not re.search(r'\d', value):
			raise serializers.ValidationError('PASSWORD_INVALID - Password must contain a digit.')
		
		if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
			raise serializers.ValidationError('PASSWORD_INVALID - Password must contain a special character.')
		
		return value
	
	def validate(self, data):
		"""Check passwords match."""
		if data.get('new_password') != data.get('new_password_confirm'):
			raise serializers.ValidationError('PASSWORD_INVALID - Passwords do not match.')
		
		return data


class VerificationCodeSerializer(serializers.Serializer):
	"""Serializer validates email verification code."""
	
	code = serializers.CharField(max_length=6, required=True)
	
	def validate_code(self, value):
		"""Check code is 6-digit."""
		if not value.isdigit() or len(value) != 6:
			raise serializers.ValidationError('INVALID_CODE - Code must be 6 digits.')
		
		return value
