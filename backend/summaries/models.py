from django.contrib.auth.models import User
from django.db import models


class UserSummary(models.Model):
	"""AI-generated user profile summary."""

	user = models.OneToOneField(User, on_delete=models.CASCADE)
	summary = models.TextField(blank=True)
	generated_at = models.DateTimeField(auto_now_add=True)
	last_updated = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"Summary for {self.user.username}"
