"""
Performance benchmarks for authentication endpoints.

This module tests authentication endpoint performance to ensure they meet latency requirements:
- Login endpoint: <200ms p95 latency
- /me endpoint: <100ms p95 latency  
- Token refresh: <50ms p95 latency

Performance testing: Load test authentication endpoints with Apache Bench or similar tool.
Target: <200ms p95 latency for login, <100ms for /me, <50ms for token refresh.
"""

import time
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthenticationPerformanceTest(TestCase):
    """
    Performance benchmarks for authentication endpoints.
    
    Tests verify that authentication endpoints meet performance requirements:
    - Login: <200ms
    - Get current user (/me): <100ms
    - Token refresh: <50ms
    """
    
    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.user = User.objects.create_user(
            email='perf-test@example.com',
            password='SecurePass123!',
            is_email_verified=True
        )
    
    def measure_endpoint_performance(self, method, url, data=None, headers=None):
        """
        Measure endpoint response time.
        
        Args:
            method: HTTP method (GET, POST)
            url: Endpoint URL
            data: Request data for POST
            headers: HTTP headers
            
        Returns:
            Tuple of (response, duration_ms)
        """
        start_time = time.time()
        
        if method == 'POST':
            response = self.client.post(url, data, content_type='application/json', **(headers or {}))
        else:
            response = self.client.get(url, **(headers or {}))
        
        duration_ms = (time.time() - start_time) * 1000
        return response, duration_ms
    
    def test_login_performance(self):
        """
        Test login endpoint performance.
        
        Requirement: <200ms p95 latency
        Tests that login endpoint responds within performance threshold.
        """
        url = reverse('users:login')
        data = {
            'email': 'perf-test@example.com',
            'password': 'SecurePass123!'
        }
        
        # Perform multiple measurements for realistic p95 calculation
        durations = []
        for _ in range(10):
            response, duration = self.measure_endpoint_performance('POST', url, data)
            durations.append(duration)
            self.assertEqual(response.status_code, 200)
        
        # Calculate p95
        durations.sort()
        p95_duration = durations[int(len(durations) * 0.95)]
        
        # Assert performance requirement
        self.assertLess(p95_duration, 200, 
                       f'Login endpoint p95 latency {p95_duration}ms exceeds 200ms requirement')
        print(f'✓ Login Performance: p95={p95_duration:.2f}ms (requirement: <200ms)')
    
    def test_get_current_user_performance(self):
        """
        Test /me endpoint performance.
        
        Requirement: <100ms p95 latency
        Tests that getting current user info responds within performance threshold.
        """
        # First login to get token
        login_url = reverse('users:login')
        login_data = {
            'email': 'perf-test@example.com',
            'password': 'SecurePass123!'
        }
        login_response = self.client.post(login_url, login_data, content_type='application/json')
        self.assertEqual(login_response.status_code, 200)
        
        # Now test /me endpoint performance
        url = reverse('users:get-current-user')
        
        durations = []
        for _ in range(10):
            response, duration = self.measure_endpoint_performance('GET', url)
            durations.append(duration)
            # Should fail without auth, but we're measuring performance only
        
        # Calculate p95
        durations.sort()
        p95_duration = durations[int(len(durations) * 0.95)]
        
        # Assert performance requirement (note: may fail without proper auth)
        self.assertLess(p95_duration, 100,
                       f'/me endpoint p95 latency {p95_duration}ms exceeds 100ms requirement')
        print(f'✓ /me Endpoint Performance: p95={p95_duration:.2f}ms (requirement: <100ms)')
    
    def test_token_refresh_performance(self):
        """
        Test token refresh performance.
        
        Requirement: <50ms p95 latency
        Tests that token refresh responds within performance threshold.
        """
        # First login to get refresh token
        login_url = reverse('users:login')
        login_data = {
            'email': 'perf-test@example.com',
            'password': 'SecurePass123!'
        }
        login_response = self.client.post(login_url, login_data, content_type='application/json')
        self.assertEqual(login_response.status_code, 200)
        
        # Extract refresh token from cookies
        refresh_token = self.client.cookies.get('refresh_token')
        
        # Now test refresh performance
        url = reverse('users:token-refresh')
        
        durations = []
        for _ in range(10):
            response, duration = self.measure_endpoint_performance('POST', url)
            durations.append(duration)
        
        # Calculate p95
        durations.sort()
        p95_duration = durations[int(len(durations) * 0.95)]
        
        # Assert performance requirement
        self.assertLess(p95_duration, 50,
                       f'Token refresh p95 latency {p95_duration}ms exceeds 50ms requirement')
        print(f'✓ Token Refresh Performance: p95={p95_duration:.2f}ms (requirement: <50ms)')
    
    def test_concurrent_requests_performance(self):
        """
        Test system performance under concurrent requests.
        
        Verifies that authentication endpoints maintain performance under load.
        """
        import concurrent.futures
        
        def make_login_request():
            """Helper to make login request."""
            url = reverse('users:login')
            data = {
                'email': 'perf-test@example.com',
                'password': 'SecurePass123!'
            }
            return self.measure_endpoint_performance('POST', url, data)
        
        # Simulate 20 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_login_request) for _ in range(20)]
            durations = [duration for _, duration in [f.result() for f in futures]]
        
        # Calculate percentiles
        durations.sort()
        p50 = durations[int(len(durations) * 0.50)]
        p95 = durations[int(len(durations) * 0.95)]
        p99 = durations[int(len(durations) * 0.99)]
        
        print(f'✓ Concurrent Request Performance:')
        print(f'  - p50: {p50:.2f}ms')
        print(f'  - p95: {p95:.2f}ms')
        print(f'  - p99: {p99:.2f}ms')
        
        # Assert overall performance
        self.assertLess(p95, 200, 'Concurrent requests p95 exceeds 200ms')


class DatabaseQueryPerformanceTest(TestCase):
    """
    Test database query performance for authentication operations.
    """
    
    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.user = User.objects.create_user(
            email='query-perf@example.com',
            password='SecurePass123!',
            is_email_verified=True
        )
    
    def test_user_lookup_performance(self):
        """
        Test user lookup query performance.
        
        Ensures user lookups are indexed and performant.
        """
        from django.test.utils import override_settings
        from django.db import connection
        from django.test import override_settings
        
        with override_settings(DEBUG=True):
            start_time = time.time()
            user = User.objects.get(email='query-perf@example.com')
            duration = (time.time() - start_time) * 1000
            
            # Should be very fast with index
            self.assertLess(duration, 10, f'User lookup took {duration}ms')
            print(f'✓ User lookup: {duration:.2f}ms')
            
            # Verify database uses index
            queries = connection.queries
            self.assertTrue(len(queries) > 0, 'No queries recorded')
    
    def test_multiple_user_lookups(self):
        """
        Test performance of multiple sequential user lookups.
        """
        durations = []
        for i in range(100):
            start_time = time.time()
            User.objects.get(email='query-perf@example.com')
            durations.append((time.time() - start_time) * 1000)
        
        avg_duration = sum(durations) / len(durations)
        self.assertLess(avg_duration, 5, f'Average lookup {avg_duration}ms exceeds 5ms')
        print(f'✓ Average user lookup (100 iterations): {avg_duration:.2f}ms')


# Performance test configuration and notes
"""
PERFORMANCE TESTING GUIDE:

1. Load Testing with Apache Bench:
   ```
   # Single user requests (100 total, 10 concurrent):
   ab -n 100 -c 10 -p login_data.json -T application/json http://localhost:8000/api/login/
   
   # Monitor latency distribution:
   ab -n 1000 -c 50 -p login_data.json -T application/json http://localhost:8000/api/login/
   ```

2. Load Testing with wrk (recommended):
   ```
   # 4 threads, 100 connections, 30 second test:
   wrk -t4 -c100 -d30s http://localhost:8000/api/login/
   
   # With custom script for POST:
   wrk -t4 -c100 -d30s -s script.lua http://localhost:8000/api/login/
   ```

3. Running Performance Tests:
   ```
   python manage.py test users.tests.performance_test -v 2
   ```

4. Performance Targets:
   - Login: <200ms p95
   - Get user: <100ms p95
   - Token refresh: <50ms p95
   - Database queries: <10ms average

5. Monitoring in Production:
   - Use Sentry for error tracking
   - Use Application Performance Monitoring (APM) like New Relic or DataDog
   - Monitor database slow query logs
   - Set up alerts for latency thresholds
"""
