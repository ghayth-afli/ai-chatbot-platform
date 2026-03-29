"""
Chat Service Module

Contains ChatService class for handling chat operations:
- Creating sessions
- Sending messages
- Retrieving history
- Managing chat sessions
"""

import logging
from typing import Dict, List, Any, Optional
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.core.exceptions import PermissionDenied

from .models import ChatSession, Message
from .router import dispatch_to_provider

logger = logging.getLogger(__name__)


class ChatService:
    """Service class for chat operations."""

    VALID_MODELS = ['nemotron', 'liquid', 'trinity']
    VALID_LANGUAGES = ['en', 'ar']
    MAX_MESSAGE_LENGTH = 5000
    PAGE_SIZE = 50

    @staticmethod
    def create_session(user: User, title: str = None, model: str = 'nemotron', 
                      language: str = 'en') -> Dict[str, Any]:
        """
        Create a new chat session for a user.

        Args:
            user: User instance
            title: Optional session title (auto-generated if not provided)
            model: AI model to use ('nemotron', 'liquid', 'trinity')
            language: Language for the session ('en' or 'ar')

        Returns:
            Dict with session data
        """
        if model not in ChatService.VALID_MODELS:
            raise ValueError(f'Invalid model: {model}')

        if language not in ChatService.VALID_LANGUAGES:
            raise ValueError(f'Invalid language: {language}')

        # Auto-generate title if not provided
        if not title:
            user_session_count = ChatSession.objects.filter(user=user).count()
            title = f'Chat {user_session_count + 1:03d}'

        session = ChatSession.objects.create(
            user=user,
            title=title,
            ai_model=model,
        )

        logger.info(f'Created chat session {session.id} for user {user.id}')

        return {
            'id': session.id,
            'title': session.title,
            'model': session.ai_model,
            'language': language,
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
        }

    @staticmethod
    def get_user_sessions(user: User, page: int = 1) -> Dict[str, Any]:
        """
        Get all chat sessions for a user, paginated.

        Args:
            user: User instance
            page: Page number (1-indexed)

        Returns:
            Dict with sessions list and pagination info
        """
        sessions_qs = ChatSession.objects.filter(user=user).order_by('-updated_at')
        paginator = Paginator(sessions_qs, ChatService.PAGE_SIZE)
        page_obj = paginator.get_page(page)

        sessions_data = []
        for session in page_obj:
            sessions_data.append({
                'id': session.id,
                'title': session.title,
                'model': session.ai_model,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
                'message_count': session.messages.count(),
            })

        return {
            'sessions': sessions_data,
            'page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
        }

    @staticmethod
    def get_session_messages(user: User, session_id: int, page: int = 1) -> Dict[str, Any]:
        """
        Get messages for a specific session (with user access control).

        Args:
            user: User instance (for access control)
            session_id: Session ID
            page: Page number (1-indexed)

        Returns:
            Dict with messages and pagination info
        """
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            raise ValueError(f'Session {session_id} not found')

        # Verify user owns this session
        if session.user != user:
            raise PermissionDenied('Access denied to this session')

        messages_qs = session.messages.all().order_by('created_at')
        paginator = Paginator(messages_qs, ChatService.PAGE_SIZE)
        page_obj = paginator.get_page(page)

        messages_data = []
        for message in page_obj:
            messages_data.append({
                'id': message.id,
                'role': message.role,
                'content': message.content,
                'model': message.ai_model,
                'created_at': message.created_at.isoformat(),
            })

        return {
            'session_id': session.id,
            'messages': messages_data,
            'page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
        }

    @staticmethod
    def send_message(user: User, session_id: int, message_text: str, 
                    model: str = None) -> Dict[str, Any]:
        """
        Send a message to AI and save both user message and response.

        Args:
            user: User instance
            session_id: Session ID
            message_text: User's message
            model: Optional model override (if None, uses session model)

        Returns:
            Dict with response and update info
        """
        # Validate message
        if not message_text or not message_text.strip():
            raise ValueError('Message cannot be empty')

        if len(message_text) > ChatService.MAX_MESSAGE_LENGTH:
            raise ValueError(f'Message exceeds {ChatService.MAX_MESSAGE_LENGTH} character limit')

        # Get session and verify access
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            raise ValueError(f'Session {session_id} not found')

        if session.user != user:
            raise PermissionDenied('Access denied to this session')

        # Determine which model to use
        ai_model = model or session.ai_model
        if ai_model not in ChatService.VALID_MODELS:
            raise ValueError(f'Invalid model: {ai_model}')

        # Save user message
        user_message = Message.objects.create(
            session=session,
            role='user',
            content=message_text,
        )
        logger.info(f'Saved user message {user_message.id} to session {session_id}')

        # Get response from AI provider
        system_prompt = (
            'You are a helpful AI assistant. Answer questions clearly and concisely. '
            'Provide accurate information and admit when you don\'t know something.'
        )

        ai_result = dispatch_to_provider(ai_model, message_text, system_prompt)

        if 'error' in ai_result:
            logger.error(f'AI provider error: {ai_result["error"]}')
            raise RuntimeError(f'AI provider error: {ai_result["error"]}')

        # Save AI response
        ai_response = ai_result['response']
        ai_message = Message.objects.create(
            session=session,
            role='assistant',
            content=ai_response,
            ai_model=ai_model,
        )
        logger.info(f'Saved AI message {ai_message.id} to session {session_id}')

        # Update session timestamp
        session.save()

        return {
            'user_message_id': user_message.id,
            'ai_message_id': ai_message.id,
            'response': ai_response,
            'model': ai_model,
            'tokens_used': ai_result.get('tokens', 0),
            'session_updated_at': session.updated_at.isoformat(),
        }

    @staticmethod
    def delete_session(user: User, session_id: int) -> Dict[str, Any]:
        """
        Delete a chat session (and all its messages via CASCADE).

        Args:
            user: User instance
            session_id: Session ID

        Returns:
            Dict with deletion confirmation
        """
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            raise ValueError(f'Session {session_id} not found')

        if session.user != user:
            raise PermissionDenied('Access denied to this session')

        message_count = session.messages.count()
        session_title = session.title

        session.delete()
        logger.info(f'Deleted session {session_id} ({message_count} messages)')

        return {
            'status': 'deleted',
            'session_id': session_id,
            'session_title': session_title,
            'messages_deleted': message_count,
        }

    @staticmethod
    def update_session_model(user: User, session_id: int, model: str) -> Dict[str, Any]:
        """
        Update the AI model for a session.

        Args:
            user: User instance
            session_id: Session ID
            model: New model ('nemotron', 'liquid', 'trinity')

        Returns:
            Dict with updated session info
        """
        if model not in ChatService.VALID_MODELS:
            raise ValueError(f'Invalid model: {model}')

        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            raise ValueError(f'Session {session_id} not found')

        if session.user != user:
            raise PermissionDenied('Access denied to this session')

        old_model = session.ai_model
        session.ai_model = model
        session.save()

        logger.info(f'Updated session {session_id} model from {old_model} to {model}')

        return {
            'session_id': session.id,
            'model': session.ai_model,
            'updated_at': session.updated_at.isoformat(),
        }

    @staticmethod
    def paginate_messages(messages_qs, page: int = 1, page_size: int = None) -> Dict[str, Any]:
        """
        Paginate a queryset of messages.

        Args:
            messages_qs: QuerySet of Message objects
            page: Page number (1-indexed)
            page_size: Items per page (defaults to ChatService.PAGE_SIZE)

        Returns:
            Dict with paginated messages and metadata
        """
        if page_size is None:
            page_size = ChatService.PAGE_SIZE

        paginator = Paginator(messages_qs, page_size)
        page_obj = paginator.get_page(page)

        messages_data = []
        for message in page_obj:
            messages_data.append({
                'id': message.id,
                'role': message.role,
                'content': message.content,
                'model': message.ai_model,
                'created_at': message.created_at.isoformat(),
            })

        return {
            'messages': messages_data,
            'page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'page_size': page_size,
        }

    @staticmethod
    def get_session_info(user: User, session_id: int) -> Dict[str, Any]:
        """
        Get metadata about a session without messages.

        Args:
            user: User instance
            session_id: Session ID

        Returns:
            Dict with session metadata
        """
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            raise ValueError(f'Session {session_id} not found')

        if session.user != user:
            raise PermissionDenied('Access denied to this session')

        return {
            'id': session.id,
            'title': session.title,
            'model': session.ai_model,
            'message_count': session.messages.count(),
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
        }
