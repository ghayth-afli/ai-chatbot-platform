"""Integration tests for User Story 4: automatic summary generation."""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from chats.models import ChatSession, Message
from ai.models import UserSummary
from ai.services.summary_service import SummaryService


@pytest.mark.django_db
def test_batch_summary_generation_exposes_summary_via_profile_api():
    """Simulate user sending 5+ messages and ensure summary appears on profile."""
    UserSummary.objects.all().delete()

    user = User.objects.create_user(
        username="summary-flow-user",
        email="summary-flow@example.com",
        password="pass1234",
    )

    session = ChatSession.objects.create(
        user=user,
        title="Productivity coaching",
        ai_model="nemotron",
        language_tag="en",
        message_count=5,
    )

    for idx in range(5):
        Message.objects.create(
            session=session,
            role="user" if idx % 2 == 0 else "assistant",
            content=f"Message {idx}",
            language_tag="en",
        )

    created = SummaryService.batch_generate_summaries()
    assert any(summary.source_session_id == session.id for summary in created)

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/ai/users/{user.id}/profile/summary")
    assert response.status_code == 200

    payload = response.json()
    assert payload["count"] >= 1
    first_summary = payload["results"][0]
    assert first_summary["language_tag"] == "en"
    assert first_summary["source_session_id"] == session.id
    assert len(first_summary["summary_text"]) > 0
