from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class AIModel(models.Model):
	"""Available AI models and providers."""

	name = models.CharField(max_length=50, unique=True)
	provider = models.CharField(max_length=50)
	is_active = models.BooleanField(default=True)

	def __str__(self):
		return f"{self.name} ({self.provider})"


class UserSummary(models.Model):
	"""
	AI-generated user interaction summary (per session or aggregated).
	
	Supports multiple summaries per user with language tagging.
	Summaries can be archived (soft delete) for user preference management.
	"""

	LANGUAGE_CHOICES = (
		('en', 'English'),
		('ar', 'Arabic'),
	)

	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_summaries')
	summary_text = models.TextField(max_length=2000)
	language_tag = models.CharField(
		max_length=5,
		choices=LANGUAGE_CHOICES,
		db_index=True
	)
	date_generated = models.DateTimeField(default=timezone.now)
	source_session_id = models.IntegerField(null=True, blank=True, help_text="ChatSession ID used to generate this summary")
	relevance_score = models.FloatField(default=1.0, help_text="Confidence score [0.0-1.0] for future ranking")
	archived = models.BooleanField(default=False, db_index=True, help_text="Soft delete flag; archived summaries remain in DB")

	class Meta:
		indexes = [
			models.Index(fields=['user', 'archived', '-date_generated']),  # For active summaries, newest first
			models.Index(fields=['user', 'language_tag', 'archived']),  # For language filtering
		]
		ordering = ['-date_generated']  # Default sort newest first

	def __str__(self):
		return f"Summary for {self.user.username} ({self.language_tag}) - {self.date_generated.strftime('%Y-%m-%d')}"
