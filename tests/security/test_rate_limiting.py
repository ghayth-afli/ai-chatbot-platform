"""Security tests for rate limiter middleware (100 req/min restriction)."""

import json

import pytest
from django.contrib.auth.models import User
from django.test import RequestFactory

from common.middleware.rate_limiter import RateLimiterMiddleware


@pytest.mark.django_db
def test_rate_limit_triggers_after_100_requests(monkeypatch):
    """Authenticated user hits 100 requests and receives 429 with localized payload."""
    user = User.objects.create_user(username="rate-user", password="pass1234")
    factory = RequestFactory()

    middleware = RateLimiterMiddleware(lambda request: request)

    # Use simple dict-based cache to avoid relying on global cache state
    cache_store = {}

    def fake_cache_get(key):
        return cache_store.get(key)

    def fake_cache_set(key, value, timeout):
        cache_store[key] = value

    monkeypatch.setattr("common.middleware.rate_limiter.cache.get", fake_cache_get)
    monkeypatch.setattr("common.middleware.rate_limiter.cache.set", fake_cache_set)

    request = factory.get("/api/chat/history/")
    request.user = user
    request.language = "ar"

    # First 100 requests should pass through
    for _ in range(100):
        assert middleware.process_request(request) is None

    response = middleware.process_request(request)
    assert response is not None
    assert response.status_code == 429
    payload = json.loads(response.content)
    assert "تجاوزت حد" in payload["detail"]
    assert payload["retry_after"] > 0
    assert response["Retry-After"] == str(payload["retry_after"])


@pytest.mark.django_db
def test_rate_limit_resets_after_window(monkeypatch):
    """Requests allowed again once the 60 second window expires."""
    user = User.objects.create_user(username="rate-reset", password="pass1234")
    factory = RequestFactory()
    middleware = RateLimiterMiddleware(lambda request: request)

    cache_store = {}

    def fake_cache_get(key):
        return cache_store.get(key)

    def fake_cache_set(key, value, timeout):
        cache_store[key] = value

    monkeypatch.setattr("common.middleware.rate_limiter.cache.get", fake_cache_get)
    monkeypatch.setattr("common.middleware.rate_limiter.cache.set", fake_cache_set)

    request = factory.get("/api/chat/history/")
    request.user = user

    # Simulate hitting the limit
    for _ in range(100):
        assert middleware.process_request(request) is None

    assert middleware.process_request(request).status_code == 429

    # Fast-forward beyond window and ensure counter resets
    counter = cache_store["rate_limit:{}".format(user.id)]
    counter["window_start"] -= middleware.WINDOW_SIZE + 1
    cache_store["rate_limit:{}".format(user.id)] = counter

    assert middleware.process_request(request) is None
