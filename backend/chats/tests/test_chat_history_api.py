"""Tests for the language-filtered chat history endpoint."""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from chats.models import ChatSession, Message


@pytest.fixture
@pytest.mark.django_db
def user():
    return User.objects.create_user(
        username='history-user',
        email='history@example.com',
        password='complex-pass-123',
    )


@pytest.fixture
@pytest.mark.django_db
def other_user():
    return User.objects.create_user(
        username='history-other',
        email='history-other@example.com',
        password='complex-pass-123',
    )


@pytest.fixture
@pytest.mark.django_db
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
@pytest.mark.django_db
def seeded_sessions(user, other_user):
    session_en = ChatSession.objects.create(
        user=user,
        title='English Session',
        ai_model='nemotron',
        language_tag='en',
    )
    session_ar = ChatSession.objects.create(
        user=user,
        title='Arabic Session',
        ai_model='nemotron',
        language_tag='ar',
    )
    other_session = ChatSession.objects.create(
        user=other_user,
        title='Other Session',
        ai_model='nemotron',
        language_tag='en',
    )

    # English messages
    for idx in range(3):
        Message.objects.create(
            session=session_en,
            role='user' if idx % 2 == 0 else 'assistant',
            content=f'English message {idx}',
            language_tag='en',
        )

    # Arabic messages
    for idx in range(2):
        Message.objects.create(
            session=session_ar,
            role='user',
            content=f'رسالة عربية {idx}',
            language_tag='ar',
        )

    # Messages belonging to another user (should never appear)
    Message.objects.create(
        session=other_session,
        role='user',
        content='Outside scope',
        language_tag='en',
    )

    return {'en': session_en, 'ar': session_ar}


@pytest.mark.django_db
def test_history_requires_authentication():
    client = APIClient()
    response = client.get('/api/chat/history/')
    assert response.status_code == 401


@pytest.mark.django_db
def test_history_returns_all_messages(api_client, seeded_sessions):
    response = api_client.get('/api/chat/history/?limit=10')
    assert response.status_code == 200
    payload = response.json()

    assert payload['count'] == 5  # 3 EN + 2 AR
    assert len(payload['messages']) == 5
    assert payload['language_counts']['all'] == 5
    assert payload['language_counts']['en'] == 3
    assert payload['language_counts']['ar'] == 2

    timestamps = [msg['created_at'] for msg in payload['messages']]
    assert timestamps == sorted(timestamps, reverse=True)


@pytest.mark.django_db
def test_history_filters_by_language(api_client, seeded_sessions):
    response = api_client.get('/api/chat/history/?language_filter=ar')
    assert response.status_code == 200
    payload = response.json()

    assert payload['count'] == 2
    assert len(payload['messages']) == 2
    assert all(msg['language_tag'] == 'ar' for msg in payload['messages'])


@pytest.mark.django_db
def test_history_pagination(api_client, seeded_sessions):
    response = api_client.get('/api/chat/history/?limit=2&offset=1')
    assert response.status_code == 200
    payload = response.json()

    assert payload['limit'] == 2
    assert payload['offset'] == 1
    assert len(payload['messages']) == 2


@pytest.mark.django_db
def test_history_invalid_language_returns_400(api_client, seeded_sessions):
    response = api_client.get('/api/chat/history/?language_filter=fr')
    assert response.status_code == 400
