"""
Chat API Views

Provides REST endpoints for:
- Creating new sessions
- Retrieving sessions and messages
- Sending messages
- Deleting sessions
- Updating session models
"""

import math
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.core.exceptions import PermissionDenied
from django.db.models import Prefetch, Count
from django.http import HttpResponse

from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, ChatSessionListSerializer, MessageSerializer
from .services import ChatService
from ai.services.language_service import LanguageService

logger = logging.getLogger(__name__)


class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoints for chat session management.
    
    Endpoints:
    - POST   /api/chat/ - Create new session
    - GET    /api/chat/ - List user's sessions
    - GET    /api/chat/{id}/ - Get session with messages
    - DELETE /api/chat/{id}/ - Delete session
    - POST   /api/chat/{id}/send/ - Send message to AI
    - PUT    /api/chat/{id}/update_model/ - Change session model
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        """Return only sessions owned by the current user."""
        return ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')

    def get_serializer_class(self):
        """Use lightweight serializer for list, full serializer for detail."""
        if self.action == 'list':
            return ChatSessionListSerializer
        return ChatSessionSerializer

    def create(self, request, *args, **kwargs):
        """
        POST /api/chat/ - Create a new chat session
        
        Body: {
            "title": "Python Help",  // optional
            "model": "nemotron",     // optional, defaults to nemotron
            "language": "en"         // optional, defaults to en
        }
        """
        try:
            title = request.data.get('title')
            model = request.data.get('model') or request.data.get('ai_model') or 'nemotron'
            language = request.data.get('language', 'en')

            session_data = ChatService.create_session(
                user=request.user,
                title=title,
                model=model,
                language=language,
            )

            return Response(session_data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            logger.warning(f'Invalid input for create session: {str(e)}')
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Unexpected error creating session: {str(e)}')
            return Response(
                {'error': 'Failed to create session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def list(self, request, *args, **kwargs):
        """
        GET /api/chat/?page=1 - List all user's sessions
        """
        try:
            page = int(request.query_params.get('page', 1))
            result = ChatService.get_user_sessions(request.user, page=page)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error listing sessions: {str(e)}')
            return Response(
                {'error': 'Failed to retrieve sessions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def retrieve(self, request, pk=None, *args, **kwargs):
        """
        GET /api/chat/{id}/?page=1 - Retrieve session with paginated messages
        
        Query Parameters:
            page: Page number (1-indexed), defaults to 1
        """
        try:
            page = int(request.query_params.get('page', 1))
            result = ChatService.get_session_messages(request.user, int(pk), page=page)
            if result.get('success') is False:
                status_code = result.get('status_code', status.HTTP_400_BAD_REQUEST)
                return Response(
                    {'error': result.get('error', 'Failed to retrieve session')},
                    status=status_code,
                )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error retrieving session: {str(e)}')
            return Response(
                {'error': 'Failed to retrieve session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, pk=None, *args, **kwargs):
        """
        DELETE /api/chat/{id}/ - Delete a session (and all messages)
        """
        try:
            result = ChatService.delete_session(request.user, int(pk))
            return Response(result, status=status.HTTP_200_OK)
        except PermissionDenied as exc:
            logger.warning(
                'User %s denied deletion access to session %s',
                request.user.id,
                pk,
            )
            return Response({'error': str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            logger.warning('Delete session %s failed: %s', pk, exc)
            return Response({'error': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f'Error deleting session: {str(e)}')
            return Response(
                {'error': 'Failed to delete session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """
        POST /api/chat/{id}/send/ - Send a message and get AI response
        
        Body: {
            "message": "What is Python?",
            "model": "Nemotron"  // optional, uses session model if not provided
        }
        """
        language = getattr(request, 'language', None)
        profile_language = None
        if request.user and request.user.is_authenticated:
            try:
                profile_language = getattr(request.user.profile, 'language_preference', None)
            except AttributeError:
                profile_language = None

        if not language and profile_language:
            language = profile_language
        elif language == 'en' and profile_language and profile_language != 'en':
            language = profile_language
        language = language or 'en'

        try:
            raw_message = request.data.get('message') or request.data.get('message_text') or ''
            message_text = raw_message.strip()
            model = request.data.get('model')

            result = ChatService.send_message(
                user=request.user,
                session_id=int(pk),
                message_text=message_text,
                model=model,
                language=language,
            )

            if not result.get('success'):
                status_code = result.get('status_code', status.HTTP_400_BAD_REQUEST)
                error_code = result.get('error_code')
                retry_after_seconds = None

                if error_code == 'message_too_long':
                    error_msg = LanguageService.get_localized_error_message(
                        'message_too_long',
                        language,
                        max_length=ChatService.MAX_MESSAGE_LENGTH,
                    )
                elif error_code == 'session_not_found':
                    error_msg = LanguageService.get_localized_error_message(
                        'session_not_found',
                        language,
                        session_id=pk,
                    )
                elif error_code == 'access_denied':
                    error_msg = LanguageService.get_localized_error_message('access_denied', language)
                elif error_code == 'ai_provider_error':
                    error_msg = LanguageService.get_localized_error_message('ai_provider_error', language)
                elif error_code == 'provider_rate_limit_error':
                    retry_after_seconds = max(1, int(result.get('retry_after_seconds', 60)))
                    minutes = max(1, math.ceil(retry_after_seconds / 60))
                    error_msg = LanguageService.get_localized_error_message(
                        'provider_rate_limit_error',
                        language,
                        minutes=minutes,
                    )
                elif error_code == 'message_empty':
                    error_msg = LanguageService.get_localized_error_message('empty_message', language)
                elif error_code == 'invalid_model':
                    error_msg = LanguageService.get_localized_error_message('chat_error', language)
                else:
                    error_msg = LanguageService.get_localized_error_message('chat_error', language)

                logger.warning('Send message failed for session %s: %s', pk, result.get('error'))
                response = Response({'error': error_msg}, status=status_code)
                if error_code == 'provider_rate_limit_error' and retry_after_seconds:
                    response['Retry-After'] = str(retry_after_seconds)
                    reset_iso = result.get('rate_limit_reset_iso')
                    if reset_iso:
                        response['X-RateLimit-Reset'] = reset_iso
                return response

            logger.info(f'Message sent successfully. Response: {result}')
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Unexpected error sending message: {str(e)}')
            error_msg = LanguageService.get_localized_error_message('chat_error', language)
            return Response(
                {'error': error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['put'])
    def update_model(self, request, pk=None):
        """
        PUT /api/chat/{id}/update_model/ - Change the AI model for a session
        
        Body: {
            "model": "Liquid"  // 'Nemotron', 'Liquid', or 'Trinity'
        }
        """
        try:
            model = request.data.get('model', '').strip()

            if not model:
                return Response(
                    {'error': 'Model cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = ChatService.update_session_model(
                user=request.user,
                session_id=int(pk),
                model=model,
            )

            if not result.get('success'):
                status_code = result.get('status_code', status.HTTP_400_BAD_REQUEST)
                return Response({'error': result.get('error')}, status=status_code)

            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error updating session model: {str(e)}')
            return Response(
                {'error': 'Failed to update model'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """GET /api/chat/{id}/export/?format=pdf&language=en - Export a chat transcript."""
        export_format = request.query_params.get('format', 'text').lower()
        language = request.query_params.get('language', 'en').lower()

        try:
            export_data = ChatService.export_session(
                user=request.user,
                session_id=int(pk),
                export_format=export_format,
                language=language,
            )

            if not export_data.get('success', True):
                status_code = export_data.get('status_code', status.HTTP_400_BAD_REQUEST)
                error_message = export_data.get('error', 'Failed to export session')
                return Response({'error': error_message}, status=status_code)

            response = HttpResponse(
                export_data['content'],
                content_type=export_data['content_type'],
            )
            response['Content-Disposition'] = (
                f'attachment; filename="{export_data["filename"]}"'
            )
            return response
        except ValueError as e:
            logger.warning(f'Export error: {str(e)}')
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied:
            logger.warning(
                f'User {request.user.id} denied export access to session {pk}'
            )
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception as e:
            logger.error(f'Failed to export session {pk}: {str(e)}')
            return Response(
                {'error': 'Failed to export session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChatHistoryListView(APIView):
    """Aggregated chat history filtered by language for the authenticated user."""

    permission_classes = [IsAuthenticated]
    DEFAULT_LIMIT = 20
    MAX_LIMIT = 100

    def get(self, request):
        """Return paginated chat messages with optional language filter."""
        raw_language = (request.query_params.get('language_filter') or '').strip().lower()
        if raw_language and raw_language not in ('en', 'ar', 'all'):
            return Response(
                {
                    'detail': 'Invalid language_filter. Supported values: en, ar, all.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        language_filter = None if raw_language in ('', 'all') else raw_language
        limit = self._parse_limit(request.query_params.get('limit'))
        offset = self._parse_offset(request.query_params.get('offset'))

        base_queryset = Message.objects.filter(session__user=request.user)

        # Build counts snapshot before applying filter so tabs can show totals
        counts_snapshot = base_queryset.values('language_tag').annotate(total=Count('id'))
        counts_map = {item['language_tag'] or 'unknown': item['total'] for item in counts_snapshot}
        language_counts = {
            'all': sum(counts_map.values()),
            'en': counts_map.get('en', 0),
            'ar': counts_map.get('ar', 0),
        }

        if language_filter:
            base_queryset = base_queryset.filter(language_tag=language_filter)

        total_count = base_queryset.count()
        messages_qs = (
            base_queryset.select_related('session')
            .order_by('-created_at')[offset: offset + limit]
        )

        messages = []
        for message in messages_qs:
            messages.append({
                'id': message.id,
                'session_id': message.session_id,
                'session_title': message.session.title,
                'role': message.role,
                'content': message.content,
                'language_tag': message.language_tag or message.session.language_tag or 'en',
                'model': message.ai_model,
                'created_at': message.created_at.isoformat(),
            })

        return Response({
            'messages': messages,
            'count': total_count,
            'limit': limit,
            'offset': offset,
            'language_filter': language_filter or 'all',
            'language_counts': language_counts,
        })

    def _parse_limit(self, value):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            parsed = self.DEFAULT_LIMIT
        return max(1, min(self.MAX_LIMIT, parsed))

    @staticmethod
    def _parse_offset(value):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            parsed = 0
        return max(0, parsed)
