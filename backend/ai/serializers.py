"""
API Serializers for AI module

Handles serialization/deserialization of AI-related models:
- UserSummary: AI-generated interaction summaries
- Language preference updates
"""

from rest_framework import serializers
from ai.models import UserSummary
from users.models import Profile


class UserSummarySerializer(serializers.ModelSerializer):
    """Serializer for UserSummary model."""

    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserSummary
        fields = [
            'id',
            'user_id',
            'user_username',
            'summary_text',
            'language_tag',
            'date_generated',
            'source_session_id',
            'relevance_score',
            'archived'
        ]
        read_only_fields = [
            'id',
            'date_generated',
            'user_id',
            'user_username',
            'relevance_score'
        ]


class LanguagePreferenceSerializer(serializers.ModelSerializer):
    """Serializer for updating user language preference."""

    class Meta:
        model = Profile
        fields = ['language_preference']


__all__ = ['UserSummarySerializer', 'LanguagePreferenceSerializer']
