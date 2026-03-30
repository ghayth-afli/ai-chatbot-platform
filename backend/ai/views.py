"""
AI-related views for multi-language user profiles and summaries.

Views:
- ProfileSummaryListView: GET /api/ai/users/{user_id}/profile/summary
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from ai.models import UserSummary
from ai.serializers import UserSummarySerializer, LanguagePreferenceSerializer
from users.models import Profile


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination for API results."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ProfileSummaryListView(APIView):
    """
    API View for managing user profile summaries.
    
    GET /api/ai/users/{user_id}/profile/summary: List user summaries (paginated)
    """
    
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, user_id=None):
        """
        GET /api/ai/users/{user_id}/profile/summary
        
        Returns paginated list of active summaries for user.
        
        Args:
            user_id: User ID (from path parameter)
            
        Returns:
            Paginated list of summaries with fields:
            - id
            - user_id
            - summary_text
            - language_tag
            - date_generated
            - archived
            - relevance_score
            
        Raises:
            404: User not found
            401: Not authenticated
        """
        # Get user
        user = get_object_or_404(User, id=user_id)
        
        # Check authorization: user can only view own summaries (or admin)
        if request.user.id != user_id and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to view these summaries.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Query active (non-archived) summaries, ordered by newest first
        summaries = UserSummary.objects.filter(
            user=user,
            archived=False
        ).order_by('-date_generated', '-id')
        
        # Paginate results
        paginator = self.pagination_class()
        paginated_summaries = paginator.paginate_queryset(summaries, request)
        
        # Serialize
        serializer = UserSummarySerializer(paginated_summaries, many=True)
        
        return paginator.get_paginated_response(serializer.data)


class LanguagePreferenceUpdateView(APIView):
    """
    API View for updating user's language preference.
    
    PATCH /api/ai/users/{user_id}/language-preference: Update language preference
    """
    
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id=None):
        """
        PATCH /api/ai/users/{user_id}/language-preference
        
        Update user's preferred language.
        
        Args:
            user_id: User ID (from path parameter)
            Request body: { "language_preference": "en" or "ar" }
            
        Returns:
            200: Updated user object with language_preference
            400: Invalid language code
            401: Not authenticated
            403: Not authorized (not own account)
            404: User not found
        """
        # Get user
        user = get_object_or_404(User, id=user_id)
        
        # Check authorization: user can only update own preference
        if request.user.id != user_id and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to update this user\'s preference.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get language preference from request
        language_preference = request.data.get('language_preference')
        
        if not language_preference:
            return Response(
                {'language_preference': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate language code
        if language_preference not in ['en', 'ar']:
            return Response(
                {'language_preference': ['Invalid language. Supported: en, ar']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user profile
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=user)
        
        profile.language_preference = language_preference
        profile.save()
        
        # Return updated profile
        serializer = LanguagePreferenceSerializer(profile)
        return Response(
            {
                'id': user.id,
                'username': user.username,
                'language_preference': profile.language_preference,
                'language_preference_updated_at': profile.language_preference_updated_at.isoformat()
            },
            status=status.HTTP_200_OK
        )
