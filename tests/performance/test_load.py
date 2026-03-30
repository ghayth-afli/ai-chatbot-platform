"""Performance validation for high-traffic chat endpoints."""

import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytest
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import RequestFactory
from rest_framework.test import APIClient

from ai.models import UserSummary
from chats.models import ChatSession, Message
from common.middleware.rate_limiter import RateLimiterMiddleware

REQUEST_TOTAL = 100
MAX_WORKERS = 20


def _seed_users(total=12):
    """Create users with summaries, sessions, and chat history."""
    records = []
    for idx in range(total):
        user = User.objects.create_user(
            username=f"perf-user-{idx}",
            email=f"perf{idx}@example.com",
            password="complex-pass-123",
        )
        profile = user.profile
        profile.language_preference = 'ar' if idx % 2 else 'en'
        profile.save()

        session = ChatSession.objects.create(
            user=user,
            title=f"Perf Session {idx}",
            ai_model='nemotron',
            language_tag=profile.language_preference,
        )

        # Seed alternating user/assistant messages for history endpoint.
        for msg_idx in range(6):
            Message.objects.create(
                session=session,
                role='user' if msg_idx % 2 == 0 else 'assistant',
                content=f"Perf message {msg_idx}",
                language_tag=profile.language_preference,
            )

        for summary_idx in range(3):
            UserSummary.objects.create(
                user=user,
                summary_text=f"Summary snippet {summary_idx} for user {idx}",
                language_tag=profile.language_preference,
                archived=False,
            )

        records.append({'user': user, 'session': session})
    return records


def _run_concurrent_requests(total, worker, max_workers=MAX_WORKERS):
    durations = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(worker, idx) for idx in range(total)]
        for future in as_completed(futures):
            durations.append(future.result())
    return durations


@pytest.mark.django_db(transaction=True)
def test_core_endpoints_handle_parallel_load(monkeypatch):
    """Ensure chat APIs stay responsive under concurrent usage."""

    def fake_send_message(user, session_id, message_text, model=None, language='en'):
        return {
            'user_message_id': 1,
            'ai_message_id': 2,
            'response': f"[mock] {message_text}",
            'model': model or 'nemotron',
            'language': language,
            'tokens_used': 0,
            'session_updated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'session_title': 'Perf Session',
        }

    # Patch heavy operations so the test measures request overhead only.
    monkeypatch.setattr('chats.views.ChatService.send_message', fake_send_message)

    original_limit = RateLimiterMiddleware.REQUESTS_PER_MINUTE
    RateLimiterMiddleware.REQUESTS_PER_MINUTE = 1000

    user_records = _seed_users()
    cache.clear()

    def summary_worker(idx):
        record = user_records[idx % len(user_records)]
        client = APIClient()
        client.force_authenticate(user=record['user'])
        start = time.perf_counter()
        response = client.get(f"/api/ai/users/{record['user'].id}/profile/summary")
        duration = time.perf_counter() - start
        assert response.status_code == 200
        assert response.json()['count'] >= 3
        return duration

    summary_durations = _run_concurrent_requests(REQUEST_TOTAL, summary_worker)
    assert max(summary_durations) < 2.0, "Profile summary responses exceeded 2 seconds"

    def send_worker(idx):
        record = user_records[idx % len(user_records)]
        client = APIClient()
        client.force_authenticate(user=record['user'])
        payload = {
            'message': f"Load test message {idx}",
            'model': 'nemotron',
        }
        start = time.perf_counter()
        response = client.post(
            f"/api/chat/{record['session'].id}/send/",
            data=payload,
            format='json',
        )
        duration = time.perf_counter() - start
        assert response.status_code == 200
        assert response.json()['language'] in ('en', 'ar')
        return duration

    send_durations = _run_concurrent_requests(REQUEST_TOTAL, send_worker, max_workers=10)
    assert max(send_durations) < 2.0, "Chat send responses exceeded 2 seconds"

    def history_worker(idx):
        record = user_records[idx % len(user_records)]
        client = APIClient()
        client.force_authenticate(user=record['user'])
        start = time.perf_counter()
        response = client.get('/api/chat/history/?limit=10')
        duration = time.perf_counter() - start
        assert response.status_code == 200
        payload = response.json()
        assert payload['language_counts']['all'] >= 6
        return duration

    history_durations = _run_concurrent_requests(REQUEST_TOTAL, history_worker)
    assert max(history_durations) < 2.0, "Chat history responses exceeded 2 seconds"

    # Reset limiter and verify 429 responses return quickly when the cap is hit.
    RateLimiterMiddleware.REQUESTS_PER_MINUTE = original_limit
    cache.clear()
    factory = RequestFactory()
    middleware = RateLimiterMiddleware(lambda req: None)
    test_user = user_records[0]['user']

    def _build_request():
        req = factory.get('/api/chat/history/')
        req.user = test_user
        req.language = 'en'
        return req

    for _ in range(original_limit):
        assert middleware.process_request(_build_request()) is None

    limit_start = time.perf_counter()
    limited_response = middleware.process_request(_build_request())
    limit_duration = time.perf_counter() - limit_start
    assert limited_response is not None
    assert limited_response.status_code == 429
    assert limit_duration < 0.5, 'Rate limit responses should return in under 500ms'
