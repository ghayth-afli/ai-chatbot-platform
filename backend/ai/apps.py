from django.apps import AppConfig


class AiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai'
    
    def ready(self):
        """
        Register signal handlers when app is ready.
        
        This ensures signal handlers are connected before any model operations occur.
        """
        import ai.signals  # noqa: F401
