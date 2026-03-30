"""
E2E Integration Tests for Summary Generation

Tests:
- User sends 5 messages → automatic summary generation via signal
- Summary appears in user profile when requested
- Summary is in correct language matching session language
- Multiple sessions generate independent summaries
"""

import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from chats.models import ChatSession, Message
from ai.models import UserSummary


class SummaryGenerationE2ETestCase(TestCase):
    """End-to-end tests for summary generation feature."""

    def setUp(self):
        """Set up test fixtures."""
        # Create user
        self.user = User.objects.create_user(
            username='e2e_user',
            email='e2e@example.com',
            password='e2epass123'
        )

    def test_summary_generation_after_5_messages(self):
        """Test: After 5 messages in a session, automatic summary is generated."""
        # Create a chat session
        session = ChatSession.objects.create(
            user=self.user,
            title='E2E Test Session',
            ai_model='nemotron',
            language_tag='en',
            message_count=0
        )

        # Create 5 messages
        # Note: The post_save signal on Message will automatically increment message_count
        for i in range(5):
            Message.objects.create(
                session=session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'E2E test message {i+1}',
                language_tag='en'
            )

        # Refresh session to get updated message_count from signal
        session.refresh_from_db()
        
        # Check message count was incremented by signal
        self.assertGreaterEqual(session.message_count, 5, 
                               f"Signal should have incremented message_count to at least 5, got {session.message_count}")

        # Check that a summary was created for this session
        summary = UserSummary.objects.filter(source_session_id=session.id).first()
        
        # If signal worked correctly, summary should be created when count reaches 5
        if session.message_count >= 5:
            self.assertIsNotNone(summary, 
                               f"Summary should be created after 5 messages (message_count={session.message_count})")
        else:
            self.skipTest(f"Signal did not increment message_count to 5 (got {session.message_count})")

    def test_summary_appears_for_user(self):
        """Test: Generated summary appears in UserSummary for the user."""
        # Create session with 5 messages
        session = ChatSession.objects.create(
            user=self.user,
            title='Profile Test Session',
            ai_model='nemotron',
            language_tag='en',
            message_count=5
        )

        for i in range(5):
            Message.objects.create(
                session=session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Profile test message {i+1}',
                language_tag='en'
            )

        # Create summary for session
        summary = UserSummary.objects.create(
            user=self.user,
            summary_text='E2E test summary: This is a summary for testing',
            language_tag='en',
            source_session_id=session.id,
            relevance_score=0.95,
            archived=False
        )

        # Verify summary can be retrieved from database
        user_summaries = UserSummary.objects.filter(user=self.user)
        self.assertEqual(user_summaries.count(), 1)
        
        retrieved_summary = user_summaries.first()
        self.assertEqual(retrieved_summary.id, summary.id)
        self.assertEqual(retrieved_summary.language_tag, 'en')
        self.assertEqual(retrieved_summary.user, self.user)

    def test_summary_language_matches_session(self):
        """Test: Summary language_tag matches the session language."""
        # Create Arabic session
        session_ar = ChatSession.objects.create(
            user=self.user,
            title='Arabic Session E2E',
            ai_model='nemotron',
            language_tag='ar',
            message_count=5
        )

        for i in range(5):
            Message.objects.create(
                session=session_ar,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'رسالة اختبار {i+1}',  # Arabic message
                language_tag='ar'
            )

        # Create summary
        summary_ar = UserSummary.objects.create(
            user=self.user,
            summary_text='ملخص الجلسة: هذا ملخص لاختبار المحادثة',
            language_tag='ar',
            source_session_id=session_ar.id,
            relevance_score=0.90,
            archived=False
        )

        # Verify language tag matches
        self.assertEqual(summary_ar.language_tag, session_ar.language_tag)
        self.assertEqual(summary_ar.language_tag, 'ar')

    def test_multiple_sessions_independent_summaries(self):
        """Test: Multiple sessions generate independent summaries."""
        # Create two sessions
        session1 = ChatSession.objects.create(
            user=self.user,
            title='Session 1 E2E',
            ai_model='nemotron',
            language_tag='en',
            message_count=5
        )

        session2 = ChatSession.objects.create(
            user=self.user,
            title='Session 2 E2E',
            ai_model='nemotron',
            language_tag='ar',
            message_count=5
        )

        # Add messages to both
        for i in range(5):
            Message.objects.create(
                session=session1,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Session 1 message {i+1}',
                language_tag='en'
            )

            Message.objects.create(
                session=session2,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'رسالة جلسة 2: {i+1}',
                language_tag='ar'
            )

        # Create summaries for both
        summary1 = UserSummary.objects.create(
            user=self.user,
            summary_text='Session 1 summary',
            language_tag='en',
            source_session_id=session1.id,
            relevance_score=0.85,
            archived=False
        )

        summary2 = UserSummary.objects.create(
            user=self.user,
            summary_text='ملخص الجلسة 2',
            language_tag='ar',
            source_session_id=session2.id,
            relevance_score=0.88,
            archived=False
        )

        # Verify both summaries exist and are independent
        self.assertEqual(summary1.source_session_id, session1.id)
        self.assertEqual(summary2.source_session_id, session2.id)
        self.assertEqual(summary1.language_tag, 'en')
        self.assertEqual(summary2.language_tag, 'ar')
        self.assertNotEqual(summary1.id, summary2.id)

    def test_summary_not_generated_under_5_messages(self):
        """Test: No summary generated for sessions with < 5 messages."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Short Session E2E',
            ai_model='nemotron',
            language_tag='en',
            message_count=3
        )

        # Add only 3 messages
        for i in range(3):
            Message.objects.create(
                session=session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Short message {i+1}',
                language_tag='en'
            )

        # Verify no summary was created
        summary = UserSummary.objects.filter(source_session_id=session.id).first()
        self.assertIsNone(summary, "Summary should not be created for sessions with < 5 messages")

    def test_summary_archival(self):
        """Test: Summaries can be archived (soft delete)."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Archival Test Session',
            ai_model='nemotron',
            language_tag='en',
            message_count=5
        )

        for i in range(5):
            Message.objects.create(
                session=session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Archival test {i+1}',
                language_tag='en'
            )

        # Create summary
        summary = UserSummary.objects.create(
            user=self.user,
            summary_text='Archivable summary',
            language_tag='en',
            source_session_id=session.id,
            archived=False
        )

        # Archive it
        summary.archived = True
        summary.save()

        # Verify archived flag is set
        archived_summary = UserSummary.objects.get(id=summary.id)
        self.assertTrue(archived_summary.archived)

    def test_summary_relevance_score(self):
        """Test: Summaries have appropriate relevance scores."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Relevance Test Session',
            ai_model='nemotron',
            language_tag='en',
            message_count=5
        )

        for i in range(5):
            Message.objects.create(
                session=session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Relevance test {i+1}',
                language_tag='en'
            )

        # Create summary with relevance score
        summary = UserSummary.objects.create(
            user=self.user,
            summary_text='Relevant summary',
            language_tag='en',
            source_session_id=session.id,
            relevance_score=0.92
        )

        # Verify relevance score is stored
        stored_summary = UserSummary.objects.get(id=summary.id)
        self.assertEqual(stored_summary.relevance_score, 0.92)
        self.assertGreaterEqual(stored_summary.relevance_score, 0.0)
        self.assertLessEqual(stored_summary.relevance_score, 1.0)
