from django.contrib.auth.models import User
from django.db import models
import random
import string
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserExtension(models.Model):
	"""
	Extended user authentication fields for email and Google OAuth support.
	
	Stores: auth provider (email/google), profile picture URL, and email verification status.
	Creates automatically when User instance is created via signal.
	"""
	
	AUTH_PROVIDER_CHOICES = (
		('email', 'Email/Password'),
		('google', 'Google OAuth'),
	)
	
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='extension')
	auth_provider = models.CharField(max_length=50, choices=AUTH_PROVIDER_CHOICES, default='email')
	profile_picture_url = models.URLField(blank=True, null=True)
	is_verified = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	
	def __str__(self):
		return f"{self.user.username} - {self.auth_provider}"


# Signal to auto-create UserExtension when User is created
@receiver(post_save, sender=User)
def create_user_extension(sender, instance, created, **kwargs):
	"""Auto-create UserExtension when User is created."""
	if created:
		UserExtension.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_extension(sender, instance, **kwargs):
	"""Auto-save UserExtension when User is saved."""
	instance.extension.save()


class Profile(models.Model):
	"""User profile for storing additional preferences and metadata."""

	LANGUAGE_CHOICES = (
		('en', 'English'),
		('ar', 'Arabic'),
	)

	user = models.OneToOneField(User, on_delete=models.CASCADE)
	bio = models.TextField(blank=True, default='')
	language_preference = models.CharField(
		max_length=2,
		choices=LANGUAGE_CHOICES,
		default='en',
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.user.username}'s Profile"


class VerificationCode(models.Model):
	"""
	Temporary codes for email verification and password reset with 10-minute expiration.
	
	Supports two code types:
	- 'verify': Email verification during signup
	- 'reset': Password reset flow
	
	Codes are 6 digits, randomly generated, expire after 10 minutes, and are marked used when consumed.
	"""
	
	CODE_TYPE_CHOICES = (
		('verify', 'Email Verification'),
		('reset', 'Password Reset'),
	)
	
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
	code = models.CharField(max_length=6, db_index=True)
	type = models.CharField(max_length=10, choices=CODE_TYPE_CHOICES)
	expires_at = models.DateTimeField(db_index=True)
	created_at = models.DateTimeField(auto_now_add=True)
	is_used = models.BooleanField(default=False)
	
	class Meta:
		indexes = [
			models.Index(fields=['user', 'code']),
			models.Index(fields=['expires_at']),
		]
	
	def __str__(self):
		return f"{self.user.username} - {self.type} ({self.code})"
	
	@staticmethod
	def generate_code():
		"""Generate a random 6-digit code."""
		return ''.join(random.choices(string.digits, k=6))
