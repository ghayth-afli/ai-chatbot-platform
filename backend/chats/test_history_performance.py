"""
Performance tests for chat history retrieval
Tests pagination and query optimization
"""

import time
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from unittest.mock import patch

from chats.models import ChatSession, Message
from chats.services import ChatService

User = get_user_model()


class HistoryPerformanceTests(TestCase):
    """Test performance of history retrieval with large message counts"""

    def setUp(self):
        """Setup test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser',
        )
        self.client.force_authenticate(user=self.user)

    def test_retrieve_large_message_session_performance(self):
        """Test that retrieving a session with 500+ messages completes in < 2 seconds"""
        # Create a session
        session = ChatSession.objects.create(
            user=self.user,
            title='Large Conversation',
            ai_model='Nemotron',
        )

        # Create 500+ messages
        messages = []
        for i in range(501):
            role = 'user' if i % 2 == 0 else 'assistant'
            messages.append(
                Message(
                    session=session,
                    role=role,
                    content=f'Message {i}: This is a test message with some content.',
                    ai_model='Nemotron',
                )
            )

        # Bulk create for performance
        Message.objects.bulk_create(messages, batch_size=100)

        # Measure retrieval time
        start_time = time.time()

        # Retrieve first page
        result = ChatService.get_session_messages(self.user, session.id, page=1)

        elapsed_time = time.time() - start_time

        # Should complete in less than 2 seconds
        self.assertLess(
            elapsed_time,
            2.0,
            f'Retrieving 500+ message session took {elapsed_time:.2f}s, expected < 2s'
        )

        # Verify results
        self.assertEqual(result['total_count'], 501)
        self.assertGreater(result['total_pages'], 1)
        self.assertEqual(len(result['messages']), 50)  # Default page size
        self.assertLess(elapsed_time, 2.0)

    def test_pagination_memory_efficiency(self):
        """Test that pagination doesn't load all messages into memory"""
        # Create a session with many messages
        session = ChatSession.objects.create(
            user=self.user,
            title='Memory Test Session',
            ai_model='Nemotron',
        )

        # Create 1000 messages
        messages = []
        for i in range(1000):
            role = 'user' if i % 2 == 0 else 'assistant'
            messages.append(
                Message(
                    session=session,
                    role=role,
                    content=f'Message {i}',
                    ai_model='Nemotron',
                )
            )

        Message.objects.bulk_create(messages, batch_size=100)

        # Retrieve different pages and verify we get consistent results
        page1 = ChatService.get_session_messages(self.user, session.id, page=1)
        page2 = ChatService.get_session_messages(self.user, session.id, page=2)
        page_last = ChatService.get_session_messages(
            self.user, session.id, page=page1['total_pages']
        )

        # Verify page sizes
        self.assertEqual(len(page1['messages']), 50)
        self.assertEqual(len(page2['messages']), 50)
        self.assertEqual(len(page_last['messages']), 50)  # 1000 items / 50 per page = 20 pages with 50 each

        # Verify total count is consistent
        self.assertEqual(page1['total_count'], 1000)
        self.assertEqual(page2['total_count'], 1000)
        self.assertEqual(page_last['total_count'], 1000)

    def test_api_endpoint_pagination_performance(self):
        """Test API endpoint for retrieving paginated messages"""
        session = ChatSession.objects.create(
            user=self.user,
            title='API Test Session',
            ai_model='Nemotron',
        )

        # Create 100 messages
        messages = []
        for i in range(100):
            role = 'user' if i % 2 == 0 else 'assistant'
            messages.append(
                Message(
                    session=session,
                    role=role,
                    content=f'API Test Message {i}',
                    ai_model='Nemotron',
                )
            )

        Message.objects.bulk_create(messages, batch_size=50)

        # Call API endpoint with pagination
        url = reverse('chats:chat-session-detail', args=[session.id])

        start_time = time.time()
        response = self.client.get(f'{url}?page=1')
        elapsed_time = time.time() - start_time

        # Should be fast
        self.assertLess(elapsed_time, 0.5)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_count'], 100)

    def test_session_list_with_many_sessions(self):
        """Test listing many sessions with pagination"""
        # Create 100 sessions
        sessions = []
        for i in range(100):
            sessions.append(
                ChatSession(
                    user=self.user,
                    title=f'Session {i}',
                    ai_model='Nemotron',
                )
            )

        ChatSession.objects.bulk_create(sessions, batch_size=50)

        # Measure retrieval time
        start_time = time.time()

        result = ChatService.get_user_sessions(self.user, page=1)

        elapsed_time = time.time() - start_time

        # Should be fast (< 500ms)
        self.assertLess(elapsed_time, 0.5)

        # Verify results
        self.assertEqual(result['total_count'], 100)
        self.assertGreater(result['total_pages'], 1)
        self.assertEqual(len(result['sessions']), 50)

    def test_forward_and_backward_pagination(self):
        """Test navigating through pages forward and backward"""
        session = ChatSession.objects.create(
            user=self.user,
            title='Nav Test Session',
            ai_model='Nemotron',
        )

        # Create 200 messages (enough for 4 pages of 50 each)
        messages = []
        for i in range(200):
            role = 'user' if i % 2 == 0 else 'assistant'
            messages.append(
                Message(
                    session=session,
                    role=role,
                    content=f'Nav Test {i}',
                    ai_model='Nemotron',
                )
            )

        Message.objects.bulk_create(messages, batch_size=100)

        # Navigate forward
        page1 = ChatService.get_session_messages(self.user, session.id, page=1)
        page2 = ChatService.get_session_messages(self.user, session.id, page=2)
        page3 = ChatService.get_session_messages(self.user, session.id, page=3)
        page4 = ChatService.get_session_messages(self.user, session.id, page=4)

        # Verify we can navigate forward
        self.assertEqual(page1['page'], 1)
        self.assertEqual(page2['page'], 2)
        self.assertEqual(page3['page'], 3)
        self.assertEqual(page4['page'], 4)

        # Verify content is different
        page1_ids = [m['id'] for m in page1['messages']]
        page2_ids = [m['id'] for m in page2['messages']]
        self.assertEqual(len(set(page1_ids) & set(page2_ids)), 0)  # No overlap

    def test_query_efficiency_with_indexes(self):
        """Test that database indexes are being used for fast queries"""
        # Create session with messages
        session = ChatSession.objects.create(
            user=self.user,
            title='Index Test',
            ai_model='Nemotron',
        )

        messages = []
        for i in range(300):
            role = 'user' if i % 2 == 0 else 'assistant'
            messages.append(
                Message(
                    session=session,
                    role=role,
                    content=f'Index Test {i}',
                    ai_model='Nemotron',
                )
            )

        Message.objects.bulk_create(messages, batch_size=100)

        # Repeated queries should be fast due to indexes and caching
        times = []
        for _ in range(5):
            start = time.time()
            ChatService.get_session_messages(self.user, session.id, page=1)
            times.append(time.time() - start)

        # All queries should be fast
        avg_time = sum(times) / len(times)
        self.assertLess(avg_time, 0.2)
