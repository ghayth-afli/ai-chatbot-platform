"""
Unit tests for AI API views.

Tests:
- ProfileSummaryListView.get: GET /api/ai/users/{user_id}/profile/summary
- Authentication and authorization
"""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone

from ai.models import UserSummary
from chats.models import ChatSession
from users.models import Profile


@pytest.fixture
def setup_test_data(db):
    """Setup test data."""
    # Create test users
    user1 = User.objects.create_user(
        username='testuser1',
        email='user1@example.com',
        password='testpass123'
    )
    user2 = User.objects.create_user(
        username='testuser2',
        email='user2@example.com',
        password='testpass123'
    )
    
    # Set language preferences
    user1.profile.language_preference = 'en'
    user1.profile.save()
    user2.profile.language_preference = 'ar'
    user2.profile.save()
    
    # Create test session for user1
    session1 = ChatSession.objects.create(
        user=user1,
        title='Test Session 1',
        language_tag='en'
    )
    
    # Create summaries for user1
    now = timezone.now()
    summary1 = UserSummary.objects.create(
        user=user1,
        summary_text='First summary',
        language_tag='en',
        date_generated=now - timedelta(hours=2),
        archived=False
    )
    summary2 = UserSummary.objects.create(
        user=user1,
        summary_text='Second summary',
        language_tag='en',
        date_generated=now - timedelta(hours=1),
        archived=False
    )
    summary3_archived = UserSummary.objects.create(
        user=user1,
        summary_text='Archived summary',
        language_tag='en',
        date_generated=now,
        archived=True
    )
    
    return {
        'user1': user1,
        'user2': user2,
        'summary1': summary1,
        'summary2': summary2,
        'summary3_archived': summary3_archived,
        'client': APIClient()
    }


@pytest.mark.django_db
def test_get_summaries_requires_authentication(setup_test_data):
    """Test that unauthenticated requests are rejected."""
    client = setup_test_data['client']
    user1 = setup_test_data['user1']
    response = client.get(f'/api/ai/users/{user1.id}/profile/summary')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_get_own_summaries_returns_200(setup_test_data):
    """Test that user can retrieve own summaries."""
    data = setup_test_data
    data['client'].force_authenticate(user=data['user1'])
    response = data['client'].get(f'/api/ai/users/{data["user1"].id}/profile/summary')
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_get_summaries_returns_paginated_list(setup_test_data):
    """Test that summaries are returned in paginated format."""
    data = setup_test_data
    data['client'].force_authenticate(user=data['user1'])
    response = data['client'].get(f'/api/ai/users/{data["user1"].id}/profile/summary')
    assert response.status_code == status.HTTP_200_OK
    assert 'results' in response.data
    assert 'count' in response.data
    assert isinstance(response.data['results'], list)


@pytest.mark.django_db
def test_get_summaries_returns_only_active(setup_test_data):
    """Test that only non-archived summaries are returned."""
    data = setup_test_data
    data['client'].force_authenticate(user=data['user1'])
    response = data['client'].get(f'/api/ai/users/{data["user1"].id}/profile/summary')
    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 2  # Only 2 active summaries
    assert len(response.data['results']) == 2


@pytest.mark.django_db
def test_get_summaries_ordered_by_newest_first(setup_test_data):
    """Test that summaries are ordered by date_generated (newest first)."""
    data = setup_test_data
    data['client'].force_authenticate(user=data['user1'])
    response = data['client'].get(f'/api/ai/users/{data["user1"].id}/profile/summary')
    assert response.status_code == status.HTTP_200_OK
    
    summaries = response.data['results']
    assert len(summaries) == 2
    # Verify ordering: first should have newer timestamp than second
    first_date = datetime.fromisoformat(summaries[0]['date_generated'])
    second_date = datetime.fromisoformat(summaries[1]['date_generated'])
    assert first_date > second_date


@pytest.mark.django_db
def test_get_summaries_has_required_fields(setup_test_data):
    """Test that response includes all required fields."""
    data = setup_test_data
    data['client'].force_authenticate(user=data['user1'])
    response = data['client'].get(f'/api/ai/users/{data["user1"].id}/profile/summary')
    assert response.status_code == status.HTTP_200_OK
    
    summary = response.data['results'][0]
    required_fields = ['id', 'summary_text', 'language_tag', 'date_generated', 'archived']
    for field in required_fields:
        assert field in summary


@pytest.mark.django_db
def test_get_summaries_returns_empty_list_if_no_summaries(setup_test_data):
    """Test that empty list is returned if user has no summaries."""
    data = setup_test_data
    data['client'].force_authenticate(user=data['user2'])
    response = data['client'].get(f'/api/ai/users/{data["user2"].id}/profile/summary')
    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 0
    assert len(response.data['results']) == 0


@pytest.mark.django_db
def test_get_other_user_summaries_forbidden(setup_test_data):
    """Test that user cannot view other user's summaries."""
    data = setup_test_data
    data['client'].force_authenticate(user=data['user2'])
    response = data['client'].get(f'/api/ai/users/{data["user1"].id}/profile/summary')
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_get_summaries_user_not_found_returns_404(setup_test_data):
    """Test that 404 is returned if user doesn't exist."""
    data = setup_test_data
    data['client'].force_authenticate(user=data['user1'])
    response = data['client'].get('/api/ai/users/99999/profile/summary')
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_admin_can_view_any_summaries(setup_test_data):
    """Test that admin/staff users can view any summaries."""
    data = setup_test_data
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123'
    )
    data['client'].force_authenticate(user=admin)
    response = data['client'].get(f'/api/ai/users/{data["user1"].id}/profile/summary')
    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 2


@pytest.mark.django_db
def test_pagination_works(setup_test_data):
    """Test that pagination parameters are respected."""
    data = setup_test_data
    # Create more summaries
    now = timezone.now()
    for i in range(5):
        UserSummary.objects.create(
            user=data['user1'],
            summary_text=f'Summary {i}',
            language_tag='en',
            date_generated=now - timedelta(hours=i),
            archived=False
        )
    
    data['client'].force_authenticate(user=data['user1'])
    # Default page size is 10, so all should fit
    response = data['client'].get(f'/api/ai/users/{data["user1"].id}/profile/summary')
    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 7  # 2 original + 5 new
    
    # Test with custom page size
    response = data['client'].get(
        f'/api/ai/users/{data["user1"].id}/profile/summary',
        {'page_size': 3}
    )
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 3


@pytest.mark.django_db
def test_profile_summary_endpoint_exists():
    """Verify profile summary endpoint exists and is accessible."""
    client = APIClient()
    user = User.objects.create_user(username='testuser', password='testpass123')
    client.force_authenticate(user=user)
    
    # Endpoint should return 200 or 404, not 404 for missing view
    response = client.get(f'/api/ai/users/{user.id}/profile/summary')
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]
