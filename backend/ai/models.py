from django.db import models


class AIModel(models.Model):
	"""Available AI models and providers."""

	name = models.CharField(max_length=50, unique=True)
	provider = models.CharField(max_length=50)
	is_active = models.BooleanField(default=True)

	def __str__(self):
		return f"{self.name} ({self.provider})"
