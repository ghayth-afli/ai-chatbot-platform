from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class UserSummary(models.Model):
	"""AI-generated user profile summary."""

	user = models.OneToOneField(User, on_delete=models.CASCADE)
	summary = models.TextField(blank=True)
	generated_at = models.DateTimeField(auto_now_add=True)
	last_updated = models.DateTimeField(auto_now=True)

	# Track message count at time of summary for determining when to regenerate
	message_count_at_summary = models.IntegerField(default=0)

	def __str__(self):
		return f"Summary for {self.user.username}"

	@staticmethod
	def check_if_summary_needed(user):
		"""
		Check if a new summary should be generated for this user.
		
		Returns True if no summary exists or if 15+ new messages since last summary.
		
		Args:
			user: User instance
			
		Returns:
			bool: True if summary generation is needed
		"""
		from chats.models import Message
		
		# Check if summary exists
		try:
			summary = UserSummary.objects.get(user=user)
		except UserSummary.DoesNotExist:
			# No summary yet, should create one
			return True
		
		# Count total messages for this user
		total_messages = Message.objects.filter(
			session__user=user,
			role='user'  # Only count user messages
		).count()
		
		# If 15+ new messages since last summary, regenerate
		messages_since_summary = total_messages - summary.message_count_at_summary
		return messages_since_summary >= 15
