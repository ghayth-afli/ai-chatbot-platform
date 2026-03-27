from django.contrib.auth.models import User
from django.db import models


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
