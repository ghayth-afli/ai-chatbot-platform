"""
Tests for Chat Session Deletion

Validates:
- Sessions can be deleted by owner
- Cascading delete removes all messages
- Other users cannot delete sessions
- Deletion is permanent and verified
"""

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import ChatSession, Message
from .services import ChatService


class DeleteSessionTests(TestCase):
    """Test suite for session deletion functionality"""

    def setUp(self):
        """Create test users and sessions"""
        self.client = APIClient()
        
        # Create two users
        self.user1 = User.objects.create_user(username='user1', password='pass123')
        self.user2 = User.objects.create_user(username='user2', password='pass123')

        # Create sessions for both users
        self.session1 = ChatSession.objects.create(
            user=self.user1,
            title='User1 Session',
            ai_model='deepseek',
        )

        self.session2 = ChatSession.objects.create(
            user=self.user2,
            title='User2 Session',
            ai_model='deepseek',
        )

        # Add messages to session1
        for i in range(5):
            Message.objects.create(
                session=self.session1,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Message {i}',
                ai_model='deepseek',
            )

    @pytest.mark.django_db
    def test_delete_session_removes_all_messages(self):
        """Test that deleting a session cascades to remove all messages"""
        session_id = self.session1.id
        
        # Verify messages exist
        self.assertEqual(Message.objects.filter(session=self.session1).count(), 5)
        
        # Delete session
        result = ChatService.delete_session(self.user1, session_id)
        
        # Verify deletion result
        self.assertEqual(result['status'], 'deleted')
        self.assertEqual(result['messages_deleted'], 5)
        
        # Verify session is gone
        self.assertFalse(ChatSession.objects.filter(id=session_id).exists())
        
        # Verify all messages are gone (cascade delete)
        self.assertEqual(Message.objects.filter(session_id=session_id).count(), 0)

    @pytest.mark.django_db
    def test_user_cannot_delete_other_session(self):
        """Test that a user cannot delete another user's session"""
        # Attempt to delete user2's session as user1
        from django.core.exceptions import PermissionDenied
        
        with self.assertRaises(PermissionDenied):
            ChatService.delete_session(self.user1, self.session2.id)
        
        # Verify session still exists
        self.assertTrue(ChatSession.objects.filter(id=self.session2.id).exists())

    @pytest.mark.django_db
    def test_delete_nonexistent_session(self):
        """Test deleting a session that doesn't exist"""
        with self.assertRaises(ValueError):
            ChatService.delete_session(self.user1, 99999)

    @pytest.mark.django_db
    def test_api_delete_endpoint(self):
        """Test DELETE endpoint for sessions"""
        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)
        
        session_id = self.session1.id
        url = f'/api/chat/{session_id}/'
        
        # Verify session exists
        self.assertTrue(ChatSession.objects.filter(id=session_id).exists())
        
        # Delete via API
        response = self.client.delete(url)
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'deleted')
        
        # Verify session is gone
        self.assertFalse(ChatSession.objects.filter(id=session_id).exists())

    @pytest.mark.django_db
    def test_api_delete_other_user_session_forbidden(self):
        """Test that API rejects deletion of other user's sessions"""
        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)
        
        # Try to delete user2's session
        url = f'/api/chat/{self.session2.id}/'
        response = self.client.delete(url)
        
        # Verify forbidden response
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify session still exists
        self.assertTrue(ChatSession.objects.filter(id=self.session2.id).exists())

    @pytest.mark.django_db
    def test_delete_unauthenticated_forbidden(self):
        """Test that unauthenticated users cannot delete sessions"""
        # Don't authenticate
        url = f'/api/chat/{self.session1.id}/'
        response = self.client.delete(url)
        
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Session should still exist
        self.assertTrue(ChatSession.objects.filter(id=self.session1.id).exists())
