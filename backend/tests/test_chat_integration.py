"""
API Integration Tests for Chat System
Tests the complete workflow from session creation to message sending
"""

from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from unittest.mock import patch

from chats.models import ChatSession, Message

User = get_user_model()


class ChatAPIIntegrationTests(APITestCase):
    """Integration tests for complete chat workflows"""

    def setUp(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser',
        )
        self.client.force_authenticate(user=self.user)

        # API endpoints
        self.chat_create_url = reverse('chats:chat-list')
        self.chat_list_url = reverse('chats:chat-list')

    def test_complete_chat_workflow(self):
        """Test complete workflow: create session -> send message -> retrieve history"""

        # Step 1: Create a chat session
        session_data = {
            'title': 'Integration Test Chat',
            'ai_model': 'Nemotron',
            'language': 'en',
        }
        response = self.client.post(self.chat_create_url, session_data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Integration Test Chat'
        assert response.data['ai_model'] == 'Nemotron'

        session_id = response.data['id']
        session_url = reverse(':chat-detail', args=[session_id])

        # Step 2: List sessions to verify creation
        list_response = self.client.get(self.chat_list_url)
        assert list_response.status_code == status.HTTP_200_OK
        assert list_response.data['total_count'] >= 1

        session_ids = [s['id'] for s in list_response.data['sessions']]
        assert session_id in session_ids

        # Step 3: Send a message to the session
        message_data = {
            'message_text': 'Hello AI, test message',
            'model': 'Nemotron',
        }

        send_url = reverse('chats:chat-send', args=[session_id])

        with patch('chats.services.dispatch_to_provider') as mock_dispatch:
            mock_dispatch.return_value = {
                'response': 'Hello! I received your test message.',
                'tokens': 45,
                'model': 'Nemotron-chat',
            }

            send_response = self.client.post(send_url, message_data)

        assert send_response.status_code == status.HTTP_200_OK
        assert send_response.data['success'] is True
        assert send_response.data['response'] == 'Hello! I received your test message.'

        # Step 4: Retrieve session messages
        messages_url = reverse('chats:chat-detail', args=[session_id])
        messages_response = self.client.get(messages_url)

        assert messages_response.status_code == status.HTTP_200_OK
        assert messages_response.data['total_count'] == 2  # User + AI
        assert len(messages_response.data['messages']) == 2

        # Verify message order and content
        user_msg = messages_response.data['messages'][0]
        ai_msg = messages_response.data['messages'][1]

        assert user_msg['role'] == 'user'
        assert 'test message' in user_msg['content']
        assert ai_msg['role'] == 'assistant'
        assert 'received your test message' in ai_msg['content']

        # Step 5: Update session model
        update_url = reverse('chats:chat-update-model', args=[session_id])
        update_data = {'model': 'Liquid'}

        update_response = self.client.put(update_url, update_data)
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['model'] == 'Liquid'

        # Step 6: Delete the session
        delete_url = reverse('chats:chat-detail', args=[session_id])
        delete_response = self.client.delete(delete_url)

        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Verify session is deleted
        final_list = self.client.get(self.chat_list_url)
        final_ids = [s['id'] for s in final_list.data['sessions']]
        assert session_id not in final_ids

    def test_multiple_sessions_workflow(self):
        """Test managing multiple sessions concurrently"""

        # Create 3 sessions
        session_ids = []
        for i in range(3):
            session_data = {
                'title': f'Session {i + 1}',
                'ai_model': 'Nemotron',
                'language': 'en',
            }
            response = self.client.post(self.chat_create_url, session_data)
            assert response.status_code == status.HTTP_201_CREATED
            session_ids.append(response.data['id'])

        # Verify all sessions are in list
        list_response = self.client.get(self.chat_list_url)
        list_ids = [s['id'] for s in list_response.data['sessions']]

        for sid in session_ids:
            assert sid in list_ids

        # Send messages to each session
        for i, session_id in enumerate(session_ids):
            message_data = {
                'message_text': f'Message for session {i + 1}',
                'model': 'Nemotron',
            }
            send_url = reverse('chats:chat-send', args=[session_id])

            with patch('chats.services.dispatch_to_provider') as mock_dispatch:
                mock_dispatch.return_value = {
                    'response': f'Response for session {i + 1}',
                    'tokens': 20,
                    'model': 'Nemotron-chat',
                }

                send_response = self.client.post(send_url, message_data)
                assert send_response.status_code == status.HTTP_200_OK

        # Verify each session has correct messages
        for i, session_id in enumerate(session_ids):
            messages_url = reverse('chats:chat-detail', args=[session_id])
            messages_response = self.client.get(messages_url)

            assert messages_response.status_code == status.HTTP_200_OK
            assert messages_response.data['total_count'] == 2
            assert f'session {i + 1}' in messages_response.data['messages'][0]['content']

    def test_pagination_workflow(self):
        """Test pagination through sessions and messages"""

        # Create multiple sessions with many messages
        session_data = {
            'title': 'Pagination Test',
            'ai_model': 'Nemotron',
            'language': 'en',
        }
        response = self.client.post(self.chat_create_url, session_data)
        session_id = response.data['id']

        # Send 5 messages
        for i in range(5):
            message_data = {
                'message_text': f'Message {i + 1}',
                'model': 'Nemotron',
            }
            send_url = reverse('chats:chat-send', args=[session_id])

            with patch('chats.services.dispatch_to_provider') as mock_dispatch:
                mock_dispatch.return_value = {
                    'response': f'Response {i + 1}',
                    'tokens': 20,
                    'model': 'Nemotron-chat',
                }

                self.client.post(send_url, message_data)

        # Test pagination with page_size=5
        messages_url = reverse('chats:chat-detail', args=[session_id])
        page1_response = self.client.get(f'{messages_url}?page=1')

        assert page1_response.status_code == status.HTTP_200_OK
        assert page1_response.data['total_count'] == 10  # 5 user + 5 AI
        assert 'total_pages' in page1_response.data
        assert 'page' in page1_response.data

    def test_error_handling_workflow(self):
        """Test error handling in complete workflow"""

        # Test sending message to non-existent session
        fake_session_id = 99999
        message_data = {
            'message_text': 'Should fail',
            'model': 'Nemotron',
        }
        send_url = reverse('chats:chat-send', args=[fake_session_id])

        response = self.client.post(send_url, message_data)
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # Test invalid model
        session_data = {
            'title': 'Test',
            'ai_model': 'Nemotron',
            'language': 'en',
        }
        session_response = self.client.post(self.chat_create_url, session_data)
        session_id = session_response.data['id']

        message_data = {
            'message_text': 'Test',
            'model': 'invalid-model',  # Invalid
        }
        send_url = reverse('chats:chat-send', args=[session_id])

        response = self.client.post(send_url, message_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_access_control_workflow(self):
        """Test that users can only access their own data"""

        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            username='other',
        )

        # Create session as first user
        session_data = {
            'title': 'Private Session',
            'ai_model': 'Nemotron',
            'language': 'en',
        }
        response = self.client.post(self.chat_create_url, session_data)
        session_id = response.data['id']

        # Switch to other user
        self.client.force_authenticate(user=other_user)

        # Try to access first user's session
        messages_url = reverse('chats:chat-detail', args=[session_id])
        response = self.client.get(messages_url)

        # Should be forbidden
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Try to delete first user's session
        delete_url = reverse('chats:chat-detail', args=[session_id])
        response = self.client.delete(delete_url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_model_switching_workflow(self):
        """Test switching models during conversation"""

        session_data = {
            'title': 'Model Switch Test',
            'ai_model': 'Nemotron',
            'language': 'en',
        }
        response = self.client.post(self.chat_create_url, session_data)
        session_id = response.data['id']

        # Send message with Nemotron
        with patch('chats.services.dispatch_to_provider') as mock_dispatch:
            mock_dispatch.return_value = {
                'response': 'Nemotron response',
                'tokens': 20,
                'model': 'Nemotron-chat',
            }

            message_data = {
                'message_text': 'First message',
                'model': 'Nemotron',
            }
            send_url = reverse('chats:chat-send', args=[session_id])
            response = self.client.post(send_url, message_data)
            assert response.status_code == status.HTTP_200_OK

        # Switch to Liquid
        update_url = reverse('chats:chat-update-model', args=[session_id])
        update_data = {'model': 'Liquid'}
        response = self.client.put(update_url, update_data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['model'] == 'Liquid'

        # Send message with Liquid
        with patch('chats.services.dispatch_to_provider') as mock_dispatch:
            mock_dispatch.return_value = {
                'response': 'Llama response',
                'tokens': 15,
                'model': 'Liquid-8b',
            }

            message_data = {
                'message_text': 'Second message',
                'model': 'Liquid',
            }
            response = self.client.post(send_url, message_data)
            assert response.status_code == status.HTTP_200_OK

        # Verify both messages exist
        messages_url = reverse('chats:chat-detail', args=[session_id])
        response = self.client.get(messages_url)
        assert response.data['total_count'] == 4  # 2 user + 2 AI


class ChatAPIAuthenticationTests(APITestCase):
    """Test authentication requirements for chat endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.chat_list_url = reverse('chats:chat-list')

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access chat endpoints"""
        response = self.client.get(self.chat_list_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_access_allowed(self):
        """Test that authenticated users can access chat endpoints"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser',
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(self.chat_list_url)
        assert response.status_code == status.HTTP_200_OK
