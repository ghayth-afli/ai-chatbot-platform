"""
Language Context Middleware

Extracts user's language preference from profile and attaches to request object.
This middleware ensures all downstream views and services have access to the user's
language preference without needing to query the database repeatedly.

Usage:
    Add to MIDDLEWARE list in settings.py:
    'common.middleware.language_context.LanguageContextMiddleware'
"""

from django.utils.deprecation import MiddlewareMixin


class LanguageContextMiddleware(MiddlewareMixin):
    """
    Middleware to attach language context to each request.
    
    Sets request.language based on:
    1. User's Profile.language_preference if authenticated
    2. Default 'en' if not authenticated or preference not found
    
    This allows views and services to access user's language without querying DB:
        language = request.language  # e.g., 'en' or 'ar'
    """

    def process_request(self, request):
        """
        Extract language from user profile and attach to request.
        
        Args:
            request: Django HttpRequest object
            
        Returns:
            None (middleware chain continues)
        """
        # Default to English
        request.language = 'en'

        # If user is authenticated, get their language preference
        if request.user and request.user.is_authenticated:
            try:
                # Try to get user's profile
                profile = request.user.profile  # OneToOne relation
                if profile and profile.language_preference:
                    request.language = profile.language_preference
            except AttributeError:
                # Profile doesn't exist yet; use default
                pass
            except Exception as e:
                # Log error but don't break the request
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error retrieving language preference for user {request.user.id}: {e}")

        return None
