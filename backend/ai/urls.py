"""
URL routing for AI app.

Endpoints:
- GET /api/ai/users/{user_id}/profile/summary: List user summaries
- PATCH /api/ai/users/{user_id}/language-preference: Update language preference
"""

from django.urls import path
from ai.views import ProfileSummaryListView, LanguagePreferenceUpdateView

app_name = 'ai'

urlpatterns = [
    # Profile summary endpoints (T021)
    path(
        'users/<int:user_id>/profile/summary',
        ProfileSummaryListView.as_view(),
        name='profile-summary-list'
    ),
    
    # Language preference endpoints (T029)
    path(
        'users/<int:user_id>/language-preference',
        LanguagePreferenceUpdateView.as_view(),
        name='language-preference-update'
    ),
]
