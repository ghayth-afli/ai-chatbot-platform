"""
Chat API Views

Provides REST endpoints for:
- Creating new sessions
- Retrieving sessions and messages
- Sending messages
- Deleting sessions
- Updating session models
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import PermissionDenied
from django.db.models import Prefetch

from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, ChatSessionListSerializer, MessageSerializer
from .services import ChatService

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
            "model": "deepseek",     // optional, defaults to deepseek
            "language": "en"         // optional, defaults to en
        }
        """
        try:
            title = request.data.get('title')
            model = request.data.get('model', 'deepseek')
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
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            logger.warning(f'Session not found: {str(e)}')
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied:
            logger.warning(f'User {request.user.id} denied access to session {pk}')
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN,
            )
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
        except ValueError as e:
            logger.warning(f'Session not found for deletion: {str(e)}')
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied:
            logger.warning(f'User {request.user.id} denied delete access to session {pk}')
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN,
            )
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
            "model": "deepseek"  // optional, uses session model if not provided
        }
        """
        try:
            message_text = request.data.get('message', '').strip()
            model = request.data.get('model')

            if not message_text:
                return Response(
                    {'error': 'Message cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = ChatService.send_message(
                user=request.user,
                session_id=int(pk),
                message_text=message_text,
                model=model,
            )

            logger.info(f'Message sent successfully. Response: {result}')
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            logger.warning(f'Bad message data: {str(e)}')
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied:
            logger.warning(f'User {request.user.id} denied send access to session {pk}')
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN,
            )
        except RuntimeError as e:
            logger.error(f'AI provider error: {str(e)}')
            return Response(
                {'error': 'AI provider error - please try again'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            logger.error(f'Unexpected error sending message: {str(e)}')
            return Response(
                {'error': 'Failed to send message'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['put'])
    def update_model(self, request, pk=None):
        """
        PUT /api/chat/{id}/update_model/ - Change the AI model for a session
        
        Body: {
            "model": "llama3"  // 'deepseek', 'llama3', or 'mistral'
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

            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            logger.warning(f'Bad model data: {str(e)}')
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied:
            logger.warning(f'User {request.user.id} denied model update to session {pk}')
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception as e:
            logger.error(f'Error updating session model: {str(e)}')
            return Response(
                {'error': 'Failed to update model'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
