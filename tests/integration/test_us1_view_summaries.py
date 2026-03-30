"""Integration tests for User Story 1: view AI summaries in preferred language."""

import pytest
from datetime import timedelta
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient

from ai.models import UserSummary


@pytest.mark.django_db
def test_profile_summary_endpoint_returns_latest_summary_in_user_language():
    """User sees newest summary in their preferred language (Arabic)."""
    user = User.objects.create_user(
        username="summary-ar-user",
        email="summary-ar@example.com",
        password="pass1234",
    )

    profile = user.profile
    profile.language_preference = "ar"
    profile.save()

    now = timezone.now()
    # Older English summary
    older = UserSummary.objects.create(
        user=user,
        summary_text="You often ask about deployment pipelines.",
        language_tag="en",
        archived=False,
    )
    older.date_generated = now - timedelta(hours=3)
    older.save(update_fields=["date_generated"])
    # Most recent Arabic summary (Formal MSA)
    recent = UserSummary.objects.create(
        user=user,
        summary_text="تسأل بانتظام عن تحسين أداء التطبيقات السحابية.",
        language_tag="ar",
        archived=False,
    )
    recent.date_generated = now
    recent.save(update_fields=["date_generated"])

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/ai/users/{user.id}/profile/summary")
    assert response.status_code == 200

    payload = response.json()
    assert payload["count"] == 2
    assert len(payload["results"]) == 2

    newest = payload["results"][0]
    assert newest["id"] == recent.id
    assert newest["language_tag"] == "ar"
    assert "تسأل" in newest["summary_text"]
    assert newest["archived"] is False
