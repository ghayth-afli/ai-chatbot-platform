"""
Chat Service Module

Contains ChatService class for handling chat operations:
- Creating sessions
- Sending messages
- Retrieving history
- Managing chat sessions
"""

import logging
import re
import textwrap
from io import BytesIO
from typing import Dict, List, Any, Optional
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from .models import ChatSession, Message
from .router import dispatch_to_provider
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

logger = logging.getLogger(__name__)


class ChatService:
    """Service class for chat operations."""

    MODEL_NAME_MAP = {
        'nemotron': 'Nemotron',
        'liquid': 'Liquid',
        'trinity': 'Trinity',
    }
    VALID_MODELS = list(MODEL_NAME_MAP.values())
    VALID_LANGUAGES = ['en', 'ar']
    MAX_MESSAGE_LENGTH = 5000
    PAGE_SIZE = 50
    TITLE_MAX_LENGTH = 60
    EXPORT_FORMATS = {'text', 'pdf'}
    EXPORT_LABELS = {
        'en': {
            'file_prefix': 'chat',
            'title_heading': 'Chat Transcript',
            'session_title': 'Session',
            'model_label': 'Model',
            'created_label': 'Created',
            'exported_label': 'Exported',
            'user_label': 'You',
            'assistant_label': 'Assistant',
        },
        'ar': {
            'file_prefix': 'محادثة',
            'title_heading': 'سجل المحادثة',
            'session_title': 'الجلسة',
            'model_label': 'النموذج',
            'created_label': 'تاريخ الإنشاء',
            'exported_label': 'تاريخ التصدير',
            'user_label': 'أنت',
            'assistant_label': 'المساعد',
        },
    }

    @classmethod
    def _normalize_model_choice(cls, raw_model: Optional[str]) -> Optional[str]:
        """Return canonical model name if supported (case-insensitive)."""
        if raw_model is None:
            return None
        key = raw_model.strip().lower()
        if not key:
            return None
        return cls.MODEL_NAME_MAP.get(key)

    @classmethod
    def _require_valid_model(cls, raw_model: Optional[str]) -> str:
        """Validate and return canonical model name or raise ValueError."""
        canonical = cls._normalize_model_choice(raw_model)
        if not canonical:
            raise ValueError(f'Invalid model: {raw_model}')
        return canonical

    @staticmethod
    def _error_result(message: str, *, status_code: int = 400, error_code: Optional[str] = None, **extra: Any) -> Dict[str, Any]:
        """Standard error payload for service operations."""
        result: Dict[str, Any] = {
            'success': False,
            'error': message,
            'status_code': status_code,
        }
        if error_code:
            result['error_code'] = error_code
        if extra:
            result.update(extra)
        return result

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
        canonical_model = ChatService._require_valid_model(model)

        if language not in ChatService.VALID_LANGUAGES:
            raise ValueError(f'Invalid language: {language}')

        # Auto-generate title if not provided
        if not title:
            user_session_count = ChatSession.objects.filter(user=user).count()
            title = f'Chat {user_session_count + 1:03d}'

        session = ChatSession.objects.create(
            user=user,
            title=title,
            ai_model=canonical_model,
        )

        logger.info(f'Created chat session {session.id} for user {user.id}')

        return {
            'id': session.id,
            'title': session.title,
            'model': session.ai_model,
            'ai_model': session.ai_model,
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
                'ai_model': session.ai_model,
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
            return ChatService._error_result(
                f'Session {session_id} not found',
                status_code=404,
                error_code='session_not_found',
                session_id=session_id,
                messages=[],
                total_count=0,
                total_pages=0,
                page=1,
            )

        # Verify user owns this session
        if session.user != user:
            return ChatService._error_result(
                'Access denied to this session',
                status_code=403,
                error_code='access_denied',
                session_id=session_id,
                messages=[],
                total_count=0,
                total_pages=0,
                page=1,
            )

        messages_qs = session.messages.all().order_by('created_at', 'id')
        paginator = Paginator(messages_qs, ChatService.PAGE_SIZE)
        page_obj = paginator.get_page(page)

        messages_data = []
        for message in page_obj:
            messages_data.append({
                'id': message.id,
                'role': message.role,
                'content': message.content,
                'model': message.ai_model,
                'ai_model': message.ai_model,
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
                    model: str = None, language: str = 'en') -> Dict[str, Any]:
        """
        Send a message to AI and save both user message and response.

        Args:
            user: User instance
            session_id: Session ID
            message_text: User's message
            model: Optional model override (if None, uses session model)
            language: Language for this message ('en' or 'ar'), defaults to 'en'

        Returns:
            Dict with response and update info
        """
        message_text = (message_text or '').strip()

        # Validate message
        if not message_text:
            return ChatService._error_result(
                'Message cannot be empty',
                status_code=400,
                error_code='message_empty',
                language=language,
            )

        if len(message_text) > ChatService.MAX_MESSAGE_LENGTH:
            return ChatService._error_result(
                f'Message exceeds {ChatService.MAX_MESSAGE_LENGTH} character limit',
                status_code=400,
                error_code='message_too_long',
                language=language,
            )

        # Validate language
        if language not in ChatService.VALID_LANGUAGES:
            language = 'en'  # Default to English if invalid

        # Get session and verify access
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return ChatService._error_result(
                f'Session {session_id} not found',
                status_code=404,
                error_code='session_not_found',
                language=language,
            )

        if session.user != user:
            return ChatService._error_result(
                'Access denied to this session',
                status_code=403,
                error_code='access_denied',
                language=language,
            )

        # Set session language_tag on first message
        is_first_message = not session.messages.exists()
        if is_first_message and not session.language_tag:
            session.language_tag = language

        # Determine which model to use
        ai_model_input = model or session.ai_model
        try:
            canonical_model = ChatService._require_valid_model(ai_model_input)
        except ValueError as exc:
            return ChatService._error_result(
                str(exc),
                status_code=400,
                error_code='invalid_model',
                language=language,
            )

        # Save user message with language_tag
        user_message = Message.objects.create(
            session=session,
            role='user',
            content=message_text,
            language_tag=language,
        )
        logger.info(f'Saved user message {user_message.id} to session {session_id} with language {language}')

        if is_first_message:
            ChatService._maybe_update_session_title(session, message_text)

        # Get response from AI provider
        system_prompt = (
            'You are a helpful AI assistant. Answer questions clearly and concisely. '
            'Provide accurate information and admit when you don\'t know something.'
        )

        ai_result = dispatch_to_provider(canonical_model, message_text, system_prompt)

        if 'error' in ai_result:
            logger.error(f'AI provider error: {ai_result["error"]}')
            return ChatService._error_result(
                ai_result['error'],
                status_code=503,
                error_code='ai_provider_error',
                language=language,
            )

        # Save AI response with language_tag
        ai_response = ai_result['response']
        ai_message = Message.objects.create(
            session=session,
            role='assistant',
            content=ai_response,
            ai_model=canonical_model,
            language_tag=language,
        )
        logger.info(f'Saved AI message {ai_message.id} to session {session_id} with language {language}')

        # Update session timestamp
        session.save()

        return {
            'user_message_id': user_message.id,
            'ai_message_id': ai_message.id,
            'response': ai_response,
            'model': canonical_model,
            'ai_model': canonical_model,
            'language': language,
            'tokens_used': ai_result.get('tokens', 0),
            'session_updated_at': session.updated_at.isoformat(),
            'session_title': session.title,
            'success': True,
            'status_code': 200,
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
        except ChatSession.DoesNotExist as exc:
            raise ValueError(f'Session {session_id} not found') from exc

        if session.user != user:
            raise PermissionDenied('Access denied to this session')

        message_count = session.messages.count()
        session_title = session.title

        session.delete()
        logger.info(f'Deleted session {session_id} ({message_count} messages)')

        return {
            'success': True,
            'status': 'deleted',
            'session_id': session_id,
            'session_title': session_title,
            'messages_deleted': message_count,
        }

    @staticmethod
    def _finalize_title_candidate(candidate: str) -> Optional[str]:
        if not candidate:
            return None

        cleaned = re.sub(r'\s+', ' ', candidate).strip().strip('"“”')
        if not cleaned:
            return None

        if len(cleaned) > ChatService.TITLE_MAX_LENGTH:
            truncated = cleaned[:ChatService.TITLE_MAX_LENGTH].rstrip()
            last_space = truncated.rfind(' ')
            if last_space > 20:
                truncated = truncated[:last_space]
            cleaned = f'{truncated}…'

        return cleaned[0].upper() + cleaned[1:] if cleaned else None

    @staticmethod
    def _generate_session_title(message_text: str) -> Optional[str]:
        """Create a short descriptive title from the first user message."""
        if not message_text:
            return None

        cleaned = re.sub(r'\s+', ' ', message_text).strip()
        if not cleaned:
            return None

        sentence_split = re.split(r'(?<=[.!?])\s', cleaned, maxsplit=1)
        candidate = sentence_split[0]
        return ChatService._finalize_title_candidate(candidate)

    @staticmethod
    def _request_ai_generated_title(message_text: str, ai_model: str) -> Optional[str]:
        """Ask the AI provider for a concise title describing the conversation."""
        preview = (message_text or '').strip()
        if not preview:
            return None

        preview = re.sub(r'\s+', ' ', preview)
        if len(preview) > 400:
            preview = preview[:400].rstrip()

        system_prompt = (
            'You craft concise, human-friendly chat titles. '
            'Return only the title, no quotes, max 7 words.'
        )
        user_prompt = (
            'Create a short title that summarizes this request: '
            f'{preview}'
        )

        try:
            ai_result = dispatch_to_provider(ai_model, user_prompt, system_prompt)
        except Exception as exc:
            logger.warning('Failed to generate AI title: %s', exc)
            return None

        candidate = (ai_result or {}).get('response')
        if candidate:
            candidate = candidate.splitlines()[0]
        return ChatService._finalize_title_candidate(candidate)

    @staticmethod
    def _has_placeholder_title(session: ChatSession) -> bool:
        current = (session.title or '').strip().lower()
        return not current or current.startswith('chat') or current.startswith('new chat')

    @staticmethod
    def _maybe_update_session_title(session: ChatSession, message_text: str) -> None:
        """Update session title after the first message if still using a placeholder."""
        if not ChatService._has_placeholder_title(session):
            return

        generated = (
            ChatService._request_ai_generated_title(message_text, session.ai_model)
            or ChatService._generate_session_title(message_text)
        )
        if not generated:
            return

        session.title = generated
        session.save(update_fields=['title', 'updated_at'])

    @staticmethod
    def _slugify(value: str) -> str:
        value = (value or '').strip().lower()
        value = re.sub(r'[^a-z0-9\-\s_]+', '', value)
        value = re.sub(r'\s+', '-', value)
        return value.strip('-')

    @staticmethod
    def _wrap_text(text: str, width: int = 90) -> List[str]:
        if not text:
            return ['']
        return textwrap.wrap(text, width=width) or ['']

    @staticmethod
    def _get_export_labels(language: str) -> Dict[str, str]:
        return ChatService.EXPORT_LABELS.get(language, ChatService.EXPORT_LABELS['en'])

    @staticmethod
    def _render_pdf_document(metadata_lines: List[str], message_blocks: List[str]) -> bytes:
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        x_margin = 40
        y = height - 50
        line_height = 14

        def draw_line(text: str):
            nonlocal y
            if y <= 50:
                pdf.showPage()
                y = height - 50
            pdf.drawString(x_margin, y, text)
            y -= line_height

        pdf.setFont('Helvetica-Bold', 14)
        draw_line(metadata_lines[0])
        pdf.setFont('Helvetica', 10)
        for line in metadata_lines[1:]:
            draw_line(line)

        draw_line(' ')

        for block in message_blocks:
            pdf.setFont('Helvetica-Bold', 10)
            draw_line(block['header'])
            pdf.setFont('Helvetica', 10)
            for line in block['body']:
                draw_line(line)
            draw_line(' ')

        pdf.save()
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def export_session(
        user: User,
        session_id: int,
        export_format: str = 'text',
        language: str = 'en',
    ) -> Dict[str, Any]:
        if export_format not in ChatService.EXPORT_FORMATS:
            raise ValueError('Invalid export format')

        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return ChatService._error_result(
                f'Session {session_id} not found',
                status_code=404,
                error_code='session_not_found',
            )

        if session.user != user:
            return ChatService._error_result(
                'Access denied to this session',
                status_code=403,
                error_code='access_denied',
            )

        labels = ChatService._get_export_labels(language)
        messages = session.messages.order_by('created_at')
        localized_created = timezone.localtime(session.created_at).strftime('%Y-%m-%d %H:%M')
        exported_at = timezone.localtime().strftime('%Y-%m-%d %H:%M')

        metadata_lines = [
            labels['title_heading'],
            f"{labels['session_title']}: {session.title}",
            f"{labels['model_label']}: {session.ai_model}",
            f"{labels['created_label']}: {localized_created}",
            f"{labels['exported_label']}: {exported_at}",
        ]

        message_blocks = []
        for message in messages:
            role_label = labels['user_label'] if message.role == 'user' else labels['assistant_label']
            timestamp = timezone.localtime(message.created_at).strftime('%Y-%m-%d %H:%M')
            header = f"{role_label} · {timestamp}"
            body_lines = ChatService._wrap_text(message.content, width=90)
            message_blocks.append({'header': header, 'body': body_lines})

        if export_format == 'text':
            lines = metadata_lines + ['']
            for block in message_blocks:
                lines.append(block['header'])
                lines.extend(block['body'])
                lines.append('')
            content = '\n'.join(lines).strip() + '\n'
            filename = f"{ChatService._slugify(session.title) or labels['file_prefix']}-{session.id}.txt"
            return {
                'content': content.encode('utf-8'),
                'content_type': 'text/plain; charset=utf-8',
                'filename': filename,
            }

        pdf_bytes = ChatService._render_pdf_document(metadata_lines, message_blocks)
        filename = f"{ChatService._slugify(session.title) or labels['file_prefix']}-{session.id}.pdf"
        return {
            'content': pdf_bytes,
            'content_type': 'application/pdf',
            'filename': filename,
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
        canonical_model = ChatService._require_valid_model(model)

        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return ChatService._error_result(
                f'Session {session_id} not found',
                status_code=404,
                error_code='session_not_found',
            )

        if session.user != user:
            return ChatService._error_result(
                'Access denied to this session',
                status_code=403,
                error_code='access_denied',
            )

        old_model = session.ai_model
        session.ai_model = canonical_model
        session.save()

        logger.info(f'Updated session {session_id} model from {old_model} to {canonical_model}')

        return {
            'success': True,
            'session_id': session.id,
            'model': session.ai_model,
            'ai_model': session.ai_model,
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
                'ai_model': message.ai_model,
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
            'ai_model': session.ai_model,
            'message_count': session.messages.count(),
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
        }
