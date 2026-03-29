from django.contrib.auth.models import User
from django.db import models


class ChatSession(models.Model):
	"""Container for a chat session between a user and AI."""

	user = models.ForeignKey(User, on_delete=models.CASCADE)
	title = models.CharField(max_length=255, default='New Chat')
	ai_model = models.CharField(max_length=50, default='nemotron')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		# Performance indexes for common queries
		indexes = [
			models.Index(fields=['user', '-updated_at']),  # For fetching user sessions sorted by last updated
			models.Index(fields=['user', 'created_at']),   # For date-range queries
		]

	def __str__(self):
		return f"{self.user.username} - {self.title}"


class Message(models.Model):
	"""Individual message inside a chat session."""

	ROLE_CHOICES = (
		('user', 'User'),
		('assistant', 'Assistant'),
	)

	session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
	role = models.CharField(max_length=10, choices=ROLE_CHOICES)
	content = models.TextField()
	ai_model = models.CharField(max_length=50, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		# Performance indexes for common queries
		indexes = [
			models.Index(fields=['session', 'created_at']),  # For fetching messages in a session chronologically
			models.Index(fields=['session', '-created_at']), # For fetching recent messages first
		]
		ordering = ['created_at']  # Default ordering for chronological display

	def __str__(self):
		return f"{self.role}: {self.content[:50]}"
