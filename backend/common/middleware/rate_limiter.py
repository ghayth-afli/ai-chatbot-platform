"""
Rate Limiter Middleware

Enforces uniform rate limiting (100 requests per minute) across all authenticated users.
Uses Django's cache backend for efficient in-memory tracking.

Limits are applied to all requests from authenticated users.
Unauthenticated requests are not rate limited (anonymous access allowed).

Usage:
    Add to MIDDLEWARE list in settings.py:
    'common.middleware.rate_limiter.RateLimiterMiddleware'
    
    Ensure Django cache backend is configured in settings.py
"""

import time
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.utils.translation import gettext_lazy as _


class RateLimiterMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware using sliding window counter approach.
    
    Configuration:
        - Limit: 100 requests per minute per user
        - Window: 60 seconds (sliding)
        - Storage: Django cache backend (in-memory or Redis)
        - Per-user: Each authenticated user has independent counter
        
    Returns:
        - 429 (Too Many Requests) if limit exceeded
        - Localized error message based on request.language
        - Retry-After header with seconds to wait
        - X-RateLimit-* headers with limit info
    """

    REQUESTS_PER_MINUTE = 100
    WINDOW_SIZE = 60  # seconds

    def process_request(self, request):
        """
        Check rate limit for authenticated users.
        
        Args:
            request: Django HttpRequest object
            
        Returns:
            JsonResponse with 429 if limit exceeded, None otherwise
        """
        # Only rate limit authenticated users
        if not request.user or not request.user.is_authenticated:
            return None

        user_id = request.user.id
        cache_key = f"rate_limit:{user_id}"
        now = time.time()

        # Get current counter from cache
        counter_data = cache.get(cache_key)

        if counter_data is None:
            # First request in this window
            counter_data = {
                'count': 1,
                'window_start': now
            }
            cache.set(cache_key, counter_data, self.WINDOW_SIZE)
            return None

        # Check if window has expired
        if now - counter_data['window_start'] > self.WINDOW_SIZE:
            # Reset counter for new window
            counter_data = {
                'count': 1,
                'window_start': now
            }
            cache.set(cache_key, counter_data, self.WINDOW_SIZE)
            return None

        # Check if limit is exceeded
        if counter_data['count'] >= self.REQUESTS_PER_MINUTE:
            # Calculate time until reset
            time_until_reset = self.WINDOW_SIZE - (now - counter_data['window_start'])
            retry_after = int(time_until_reset) + 1

            # Get localized error message
            error_message = self._get_error_message(
                request.language if hasattr(request, 'language') else 'en',
                retry_after
            )

            response = JsonResponse({
                'detail': error_message,
                'retry_after': retry_after,
                'code': 'rate_limit_exceeded'
            }, status=429)

            # Add rate limit headers per RFC 6585
            response['Retry-After'] = str(retry_after)
            response['X-RateLimit-Limit'] = str(self.REQUESTS_PER_MINUTE)
            response['X-RateLimit-Remaining'] = '0'
            response['X-RateLimit-Reset'] = str(int(now + time_until_reset))

            return response

        # Increment counter
        counter_data['count'] += 1
        cache.set(cache_key, counter_data, self.WINDOW_SIZE)

        # Store rate limit info for response headers
        request.rate_limit_info = {
            'limit': self.REQUESTS_PER_MINUTE,
            'remaining': self.REQUESTS_PER_MINUTE - counter_data['count'],
            'reset': int(counter_data['window_start'] + self.WINDOW_SIZE)
        }

        return None

    def process_response(self, request, response):
        """
        Add rate limit info to response headers if available.
        
        Args:
            request: Django HttpRequest object
            response: Django HttpResponse object
            
        Returns:
            Modified response with rate limit headers
        """
        if hasattr(request, 'rate_limit_info'):
            info = request.rate_limit_info
            response['X-RateLimit-Limit'] = str(info['limit'])
            response['X-RateLimit-Remaining'] = str(info['remaining'])
            response['X-RateLimit-Reset'] = str(info['reset'])

        return response

    @staticmethod
    def _get_error_message(language, retry_after):
        """
        Get localized error message for rate limit exceeded.
        
        Args:
            language: Language code ('en' or 'ar')
            retry_after: Seconds to wait before retrying
            
        Returns:
            Localized error message string
        """
        if language == 'ar':
            return f"لقد تجاوزت حد معدل الطلب. يُسمح بحد أقصى 100 طلب في الدقيقة. يرجى المحاولة مرة أخرى خلال {retry_after} ثانية."
        else:
            return f"You have exceeded the rate limit. Maximum 100 requests per minute allowed. Please try again in {retry_after} seconds."
