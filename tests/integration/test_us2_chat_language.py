"""Integration tests for User Story 2: chat in preferred language."""

import pytest
from unittest.mock import patch
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from chats.models import ChatSession, Message


@pytest.mark.django_db
def test_user_switches_to_arabic_then_chats_in_msa():
    """End-to-end flow: update language preference and send localized chat messages."""
    user = User.objects.create_user(
        username="chat-lang-user",
        email="chat-lang@example.com",
        password="pass1234",
    )

    client = APIClient()
    client.force_authenticate(user=user)

    # Step 1: switch preference to Arabic via PATCH endpoint
    patch_response = client.patch(
        f"/api/ai/users/{user.id}/language-preference",
        {"language_preference": "ar"},
        format="json",
    )
    assert patch_response.status_code == 200
    user.profile.refresh_from_db()
    assert user.profile.language_preference == "ar"

    # Step 2: create chat session and send a message
    session = ChatSession.objects.create(
        user=user,
        title="Arabic session",
        ai_model="nemotron",
        language_tag="ar",
    )

    with patch("chats.services.dispatch_to_provider") as mock_dispatch:
        mock_dispatch.return_value = {
            "response": "هذا رد اختباري باللغة العربية.",
            "tokens": 12,
            "model": "nemotron",
        }

        send_response = client.post(
            f"/api/chat/{session.id}/send/",
            {"message": "مرحباً! هل يمكنك تلخيص آخر محادثة؟", "model": "nemotron"},
            format="json",
        )

        assert send_response.status_code == 200
        payload = send_response.json()
        assert payload["language"] == "ar"
        assert "رد اختباري" in payload["response"]

        user_message = Message.objects.filter(session=session, role="user").latest("created_at")
        ai_message = Message.objects.filter(session=session, role="assistant").latest("created_at")
        assert user_message.language_tag == "ar"
        assert ai_message.language_tag == "ar"

        # Step 3: invalid message shows localized error
        bad_response = client.post(
            f"/api/chat/{session.id}/send/",
            {"message": "   ", "model": "nemotron"},
            format="json",
        )
        assert bad_response.status_code == 400
        error_payload = bad_response.json()
        # Arabic error should mention that the message cannot be empty
        assert "الرسالة" in error_payload.get("error", "")
