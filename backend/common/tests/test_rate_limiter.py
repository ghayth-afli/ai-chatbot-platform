"""
Unit tests for rate limiter middleware

Tests:
- First 100 requests succeed (status 200)
- Request 101 returns 429
- After 60 seconds, counter resets
- Different users have separate counters
- Non-authenticated requests bypass rate limiter
"""

import time
from unittest.mock import patch, MagicMock
from django.test import TestCase, RequestFactory, override_settings
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.core.exceptions import PermissionDenied

from common.middleware.rate_limiter import RateLimiterMiddleware
from users.models import User


@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
})
class RateLimiterMiddlewareTestCase(TestCase):
    """
    Test suite for rate limiter middleware.
    
    Uses in-memory cache for testing to avoid external dependencies.
    """

    def setUp(self):
        """Set up test fixtures."""
        self.factory = RequestFactory()
        self.middleware = RateLimiterMiddleware(get_response=self.get_response)
        
        # Create test users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='user2@example.com',
            password='testpass123'
        )
        
        # Clear cache
        cache.clear()

    def tearDown(self):
        """Clean up after tests."""
        cache.clear()

    @staticmethod
    def get_response(request):
        """Mock get_response callable for middleware."""
        return MagicMock(status_code=200)

    def test_first_100_requests_succeed(self):
        """Test: First 100 requests from authenticated user succeed (status 200)."""
        for i in range(100):
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'en'
            
            response = self.middleware.process_request(request)
            
            # First 100 requests should return None (allowed)
            self.assertIsNone(response, f"Request {i+1} should be allowed")

    def test_request_101_returns_429(self):
        """Test: Request 101 returns 429 (Too Many Requests)."""
        # Make 100 successful requests
        for i in range(100):
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'en'
            
            response = self.middleware.process_request(request)
            self.assertIsNone(response)

        # Request 101 should be rate limited
        request = self.factory.get('/api/chat/send')
        request.user = self.user1
        request.language = 'en'
        
        response = self.middleware.process_request(request)
        
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 429)
        
        # Check response body
        import json
        data = json.loads(response.content)
        self.assertEqual(data['code'], 'rate_limit_exceeded')
        self.assertIn('detail', data)
        self.assertIn('retry_after', data)

    def test_rate_limit_exceeds_response_headers(self):
        """Test: 429 response includes proper rate limit headers."""
        # Max out rate limit
        for i in range(100):
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'en'
            self.middleware.process_request(request)

        # Trigger rate limit
        request = self.factory.get('/api/chat/send')
        request.user = self.user1
        request.language = 'en'
        response = self.middleware.process_request(request)

        # Check headers
        self.assertEqual(response['X-RateLimit-Limit'], '100')
        self.assertEqual(response['X-RateLimit-Remaining'], '0')
        self.assertIn('Retry-After', response)
        self.assertIn('X-RateLimit-Reset', response)

    def test_counter_resets_after_60_seconds(self):
        """Test: After cache expiry, counter resets and new requests are allowed."""
        # Make first 100 requests
        for i in range(100):
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'en'
            self.middleware.process_request(request)

        # Request 101 should fail
        request = self.factory.get('/api/chat/send')
        request.user = self.user1
        request.language = 'en'
        response = self.middleware.process_request(request)
        self.assertEqual(response.status_code, 429)

        # Verify cache key exists (rate limit enforced)
        cache_key = f"rate_limit:{self.user1.id}"
        self.assertIsNotNone(cache.get(cache_key))

        # Manually expire the cache entry (simulating 60 sec window expiry)
        cache.delete(cache_key)

        # After cache expiry, next request should succeed (new window starts)
        request1 = self.factory.get('/api/chat/send')
        request1.user = self.user1
        request1.language = 'en'
        response = self.middleware.process_request(request1)
        
        # Should be allowed (first request in new window)
        self.assertIsNone(response)
        
        # Second request in new window should also succeed and have rate_limit_info set
        request2 = self.factory.get('/api/chat/send')
        request2.user = self.user1
        request2.language = 'en'
        response = self.middleware.process_request(request2)
        
        self.assertIsNone(response)
        self.assertTrue(hasattr(request2, 'rate_limit_info'))

    def test_different_users_separate_counters(self):
        """Test: Different authenticated users have separate rate limit counters."""
        # User 1: Make 50 requests
        for i in range(50):
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'en'
            response = self.middleware.process_request(request)
            self.assertIsNone(response)

        # User 2: Make 100 requests (should all succeed as independent counter)
        for i in range(100):
            request = self.factory.get('/api/chat/send')
            request.user = self.user2
            request.language = 'en'
            response = self.middleware.process_request(request)
            self.assertIsNone(response, f"User 2 request {i+1} should succeed (separate counter)")

        # User 2 request 101 should be rate limited
        request = self.factory.get('/api/chat/send')
        request.user = self.user2
        request.language = 'en'
        response = self.middleware.process_request(request)
        self.assertEqual(response.status_code, 429)

        # User 1 should still have quota (only made 50 requests)
        for i in range(50):  # Make 50 more to reach 100
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'en'
            response = self.middleware.process_request(request)
            self.assertIsNone(response)

    def test_unauthenticated_requests_bypass_rate_limiter(self):
        """Test: Anonymous users are not rate limited."""
        # Make 150+ requests as anonymous user
        for i in range(150):
            request = self.factory.get('/api/chat/send')
            request.user = AnonymousUser()
            request.language = 'en'
            
            response = self.middleware.process_request(request)
            
            # Anonymous requests should never be rate limited
            self.assertIsNone(response, f"Anonymous request {i+1} should bypass rate limiter")

    def test_rate_limit_error_message_english(self):
        """Test: Rate limit error message in English."""
        # Max out rate limit
        for i in range(100):
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'en'
            self.middleware.process_request(request)

        # Trigger rate limit
        request = self.factory.get('/api/chat/send')
        request.user = self.user1
        request.language = 'en'
        response = self.middleware.process_request(request)

        import json
        data = json.loads(response.content)
        
        # Check English error message
        self.assertIn('exceeded the rate limit', data['detail'])
        self.assertIn('100 requests per minute', data['detail'])

    def test_rate_limit_error_message_arabic(self):
        """Test: Rate limit error message in Arabic (MSA)."""
        # Max out rate limit
        for i in range(100):
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'ar'
            self.middleware.process_request(request)

        # Trigger rate limit
        request = self.factory.get('/api/chat/send')
        request.user = self.user1
        request.language = 'ar'
        response = self.middleware.process_request(request)

        import json
        data = json.loads(response.content)
        
        # Check Arabic error message
        self.assertIn('تجاوزت حد معدل', data['detail'])
        self.assertIn('100 طلب', data['detail'])

    def test_response_headers_on_success(self):
        """Test: rate_limit_info is set on non-first allowed requests.
        
        Note: The middleware only sets rate_limit_info when handling existing counters,
        not on the first request (which returns directly). This test verifies that 
        behavior by making a second request.
        """
        # First request - no rate_limit_info set (returns early)
        request = self.factory.get('/api/chat/send')
        request.user = self.user1
        request.language = 'en'
        self.middleware.process_request(request)

        # Second request - rate_limit_info should be set
        request = self.factory.get('/api/chat/send')
        request.user = self.user1
        request.language = 'en'
        
        response = self.middleware.process_request(request)
        
        # Second request should succeed (None = allowed)
        self.assertIsNone(response)
        
        # Check that rate_limit_info is set on non-first allowed requests
        self.assertTrue(hasattr(request, 'rate_limit_info'), 
                       "rate_limit_info should be set on allowed requests (after first)")
        
        rate_limit_info = request.rate_limit_info
        self.assertEqual(rate_limit_info['limit'], 100)
        self.assertEqual(rate_limit_info['remaining'], 98)  # 98 remaining after 2 requests

    def test_increment_counter_on_successive_requests(self):
        """Test: Counter increments correctly on successive requests."""
        # Make first request (no rate_limit_info set for first request)
        request = self.factory.get('/api/chat/send')
        request.user = self.user1
        request.language = 'en'
        self.middleware.process_request(request)

        # Make subsequent requests and check rate_limit_info
        for i in range(2, 7):  # Make requests 2-6 and check
            request = self.factory.get('/api/chat/send')
            request.user = self.user1
            request.language = 'en'
            
            response = self.middleware.process_request(request)
            
            # All requests should be allowed
            self.assertIsNone(response)
            
            # Check that rate_limit_info exists and tracks remaining correctly
            self.assertTrue(hasattr(request, 'rate_limit_info'))
            
            # After i requests, remaining should be 100 - i
            remaining = request.rate_limit_info['remaining']
            expected_remaining = 100 - i
            self.assertEqual(
                remaining,
                expected_remaining,
                f"After {i} requests, should have {expected_remaining} remaining, got {remaining}"
            )
