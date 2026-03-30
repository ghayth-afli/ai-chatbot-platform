"""
Tests for chat services - ChatService class logic
"""

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from unittest.mock import patch, MagicMock

from chats.models import ChatSession, Message
from chats.services import ChatService
from chats.router import dispatch_to_provider

User = get_user_model()


class TestChatService(TestCase):
    """Test ChatService business logic"""

    def setUp(self):
        """Create test user and service instance"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser',
        )
        self.service = ChatService()
        self.system_prompt = 'You are a helpful assistant.'

    def test_create_session(self):
        """Test creating a new chat session"""
        session = self.service.create_session(
            user=self.user,
            title='Test Chat',
            model='Nemotron',
            language='en',
        )

        assert session['title'] == 'Test Chat'
        assert session['ai_model'] == 'Nemotron'
        assert 'id' in session
        assert ChatSession.objects.filter(id=session['id']).exists()

    def test_create_session_with_auto_title(self):
        """Test creating session without title auto-generates one"""
        session = self.service.create_session(
            user=self.user,
            title='',
            model='Nemotron',
            language='en',
        )

        assert session['title'] != ''
        assert 'Chat' in session['title'] or len(session['title']) > 0

    def test_get_user_sessions(self):
        """Test retrieving user's sessions"""
        # Create multiple sessions
        ChatSession.objects.create(
            user=self.user,
            title='Session 1',
            ai_model='Nemotron',
        )
        ChatSession.objects.create(
            user=self.user,
            title='Session 2',
            ai_model='Liquid',
        )

        # Retrieve sessions
        result = self.service.get_user_sessions(self.user)

        assert result['total_count'] == 2
        assert len(result['sessions']) == 2
        assert result['sessions'][0]['title'] in ['Session 1', 'Session 2']

    def test_get_user_sessions_pagination(self):
        """Test session pagination"""
        # Create 5 sessions
        for i in range(5):
            ChatSession.objects.create(
                user=self.user,
                title=f'Session {i}',
                ai_model='Nemotron',
            )

        # Get page 1
        result = self.service.get_user_sessions(self.user, page=1)

        assert result['total_count'] == 5
        assert 'page' in result
        assert 'total_pages' in result

    def test_get_user_sessions_other_user(self):
        """Test that users only see their own sessions"""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            username='other',
        )
        ChatSession.objects.create(
            user=self.user,
            title='My Session',
            ai_model='Nemotron',
        )
        ChatSession.objects.create(
            user=other_user,
            title='Other Session',
            ai_model='Nemotron',
        )

        result = self.service.get_user_sessions(self.user)

        assert result['total_count'] == 1
        assert result['sessions'][0]['title'] == 'My Session'

    def test_get_session_messages(self):
        """Test retrieving messages from a session"""
        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            ai_model='Nemotron',
        )

        # Create messages
        msg1 = Message.objects.create(
            session=session,
            role='user',
            content='Hello',
        )
        msg2 = Message.objects.create(
            session=session,
            role='assistant',
            content='Hi there!',
        )

        result = self.service.get_session_messages(self.user, session.id)

        assert result['total_count'] == 2
        assert len(result['messages']) == 2
        assert result['messages'][0]['content'] in ['Hello', 'Hi there!']

    def test_get_session_messages_access_control(self):
        """Test that users can't access other user's messages"""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            username='other',
        )
        session = ChatSession.objects.create(
            user=other_user,
            title='Test',
            ai_model='Nemotron',
        )

        result = self.service.get_session_messages(self.user, session.id)

        assert result.get('error') is not None or result['total_count'] == 0

    def test_get_session_messages_pagination(self):
        """Test message pagination"""
        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            ai_model='Nemotron',
        )

        # Create 10 messages
        for i in range(10):
            Message.objects.create(
                session=session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Message {i}',
            )

        result = self.service.get_session_messages(self.user, session.id, page=1)

        assert result['total_count'] == 10
        assert 'total_pages' in result

    @patch('chats.services.dispatch_to_provider')
    def test_send_message(self, mock_dispatch):
        """Test sending a message"""
        mock_dispatch.return_value = {
            'response': 'AI response',
            'tokens': 50,
            'model': 'Nemotron-chat',
        }

        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            ai_model='Nemotron',
        )

        result = self.service.send_message(
            user=self.user,
            session_id=session.id,
            message_text='Hello',
            model='Nemotron',
        )

        assert result['success']
        assert result['user_message_id'] is not None
        assert result['ai_message_id'] is not None
        assert result['response'] == 'AI response'

        # Verify messages were saved
        assert Message.objects.filter(session=session).count() == 2

    @patch('chats.services.dispatch_to_provider')
    def test_send_message_ai_error(self, mock_dispatch):
        """Test sending message when AI provider fails"""
        mock_dispatch.return_value = {
            'error': 'Provider unavailable',
        }

        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            ai_model='Nemotron',
        )

        result = self.service.send_message(
            user=self.user,
            session_id=session.id,
            message_text='Hello',
            model='Nemotron',
        )

        assert not result['success']
        assert 'error' in result

    @patch('chats.services.dispatch_to_provider')
    def test_send_message_ai_rate_limit_error(self, mock_dispatch):
        """Test sending message when AI provider hits its rate limit."""
        mock_dispatch.return_value = {
            'error': 'Rate limit exceeded',
            'error_code': 'provider_rate_limit_error',
            'status_code': 429,
            'retry_after_seconds': 120,
            'rate_limit_reset_iso': '2026-03-31T00:00:00+00:00',
        }

        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            ai_model='Nemotron',
        )

        result = self.service.send_message(
            user=self.user,
            session_id=session.id,
            message_text='Hello',
            model='Nemotron',
        )

        assert not result['success']
        assert result['error_code'] == 'provider_rate_limit_error'
        assert result['status_code'] == 429
        assert result['retry_after_seconds'] == 120

    def test_delete_session(self):
        """Test deleting a session"""
        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            ai_model='Nemotron',
        )
        session_id = session.id

        # Add messages
        Message.objects.create(
            session=session,
            role='user',
            content='Hello',
        )

        result = self.service.delete_session(self.user, session_id)

        assert result['success']
        assert not ChatSession.objects.filter(id=session_id).exists()

    def test_delete_session_access_control(self):
        """Test that users can't delete other user's sessions"""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            username='other',
        )
        session = ChatSession.objects.create(
            user=other_user,
            title='Test',
            ai_model='Nemotron',
        )

        with self.assertRaises(PermissionDenied):
            self.service.delete_session(self.user, session.id)

        assert ChatSession.objects.filter(id=session.id).exists()

    def test_update_session_model(self):
        """Test updating session model"""
        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            ai_model='Nemotron',
        )

        result = self.service.update_session_model(
            self.user,
            session.id,
            'Liquid',
        )

        assert result['success']
        assert result['model'] == 'Liquid'

        # Verify in database
        session.refresh_from_db()
        assert session.ai_model == 'Liquid'

    def test_update_session_model_access_control(self):
        """Test that users can't update other user's sessions"""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            username='other',
        )
        session = ChatSession.objects.create(
            user=other_user,
            title='Test',
            ai_model='Nemotron',
        )

        result = self.service.update_session_model(
            self.user,
            session.id,
            'Liquid',
        )

        assert not result['success']
        session.refresh_from_db()
        assert session.ai_model == 'Nemotron'

    def test_send_message_invalid_session(self):
        """Test sending message to non-existent session"""
        result = self.service.send_message(
            user=self.user,
            session_id=99999,
            message_text='Hello',
            model='Nemotron',
        )

        assert not result['success']

    def test_send_message_empty_text(self):
        """Test sending empty message"""
        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            ai_model='Nemotron',
        )

        result = self.service.send_message(
            user=self.user,
            session_id=session.id,
            message_text='',
            model='Nemotron',
        )

        assert not result['success']
        assert 'empty' in result.get('error', '').lower()
