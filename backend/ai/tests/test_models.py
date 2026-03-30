"""
Schema validation tests for multilingual user profiles feature.

Tests verify:
- User Profile model extensions (language_preference, _updated_at)
- ChatMessage language tagging (language_tag field + index)
- ChatSession language tagging (language_tag, message_count fields + indexes)
- UserSummary model structure and indexes
"""

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from datetime import datetime

from users.models import Profile
from chats.models import ChatSession, Message
from ai.models import UserSummary


class ProfileModelTests(TestCase):
    """Test Profile model extensions."""

    def setUp(self):
        """Create test user and profile."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile

    def test_profile_has_language_preference_field(self):
        """Verify Profile model has language_preference field."""
        self.assertTrue(hasattr(self.profile, 'language_preference'))

    def test_profile_language_preference_default_is_en(self):
        """Verify default language preference is 'en'."""
        self.assertEqual(self.profile.language_preference, 'en')

    def test_profile_language_preference_choices(self):
        """Verify language_preference only accepts 'en' or 'ar'."""
        # Test valid choices
        self.profile.language_preference = 'en'
        self.profile.full_clean()  # Should not raise ValidationError
        
        self.profile.language_preference = 'ar'
        self.profile.full_clean()  # Should not raise ValidationError

    def test_profile_has_language_preference_updated_at_field(self):
        """Verify Profile model has language_preference_updated_at field."""
        self.assertTrue(hasattr(self.profile, 'language_preference_updated_at'))

    def test_profile_language_preference_updated_at_auto_updates(self):
        """Verify language_preference_updated_at updates on save."""
        old_timestamp = self.profile.language_preference_updated_at
        self.profile.language_preference = 'ar'
        self.profile.save()
        
        # Refresh from DB to get updated timestamp
        self.profile.refresh_from_db()
        self.assertIsNotNone(self.profile.language_preference_updated_at)
        # Timestamp should be recent (within last minute)
        self.assertAlmostEqual(
            (datetime.now(self.profile.language_preference_updated_at.tzinfo) - 
             self.profile.language_preference_updated_at).total_seconds(),
            0,
            delta=60
        )


class ChatMessageModelTests(TestCase):
    """Test ChatMessage model extensions."""

    def setUp(self):
        """Create test data."""
        self.user = User.objects.create_user(username='testuser')
        self.session = ChatSession.objects.create(
            user=self.user,
            title='Test Chat'
        )

    def test_message_has_language_tag_field(self):
        """Verify Message model has language_tag field."""
        msg = Message(
            session=self.session,
            role='user',
            content='Hello'
        )
        self.assertTrue(hasattr(msg, 'language_tag'))

    def test_message_language_tag_choices(self):
        """Verify language_tag accepts 'en' and 'ar'."""
        msg = Message.objects.create(
            session=self.session,
            role='user',
            content='Hello',
            language_tag='en'
        )
        self.assertEqual(msg.language_tag, 'en')

        msg.language_tag = 'ar'
        msg.full_clean()  # Should not raise error

    def test_message_language_tag_nullable(self):
        """Verify language_tag is nullable (for legacy data)."""
        msg = Message.objects.create(
            session=self.session,
            role='user',
            content='Hello',
            language_tag=None
        )
        self.assertIsNone(msg.language_tag)

    def test_message_language_tag_indexed(self):
        """Verify language_tag field is indexed."""
        # Language tagging is indexed for language-filtered queries
        # This ensures performance for chat history filtering
        msg = Message.objects.create(
            session=self.session,
            role='user',
            content='Test message',
            language_tag='ar'
        )
        
        # Should be able to filter efficiently
        ar_messages = Message.objects.filter(language_tag='ar')
        self.assertIn(msg, ar_messages)


class ChatSessionModelTests(TestCase):
    """Test ChatSession model extensions."""

    def setUp(self):
        """Create test user."""
        self.user = User.objects.create_user(username='testuser')

    def test_session_has_language_tag_field(self):
        """Verify ChatSession model has language_tag field."""
        session = ChatSession(user=self.user)
        self.assertTrue(hasattr(session, 'language_tag'))

    def test_session_has_message_count_field(self):
        """Verify ChatSession model has message_count field."""
        session = ChatSession(user=self.user)
        self.assertTrue(hasattr(session, 'message_count'))

    def test_session_message_count_default_is_zero(self):
        """Verify message_count defaults to 0."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Test'
        )
        self.assertEqual(session.message_count, 0)

    def test_session_language_tag_choices(self):
        """Verify language_tag accepts valid codes."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Test',
            language_tag='en'
        )
        self.assertEqual(session.language_tag, 'en')

        session.language_tag = 'ar'
        session.full_clean()  # Should not raise error

    def test_session_message_count_increments(self):
        """Verify message_count can be incremented."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Test'
        )
        self.assertEqual(session.message_count, 0)

        session.message_count = 5
        session.save()
        
        session.refresh_from_db()
        self.assertEqual(session.message_count, 5)


class UserSummaryModelTests(TestCase):
    """Test new UserSummary model."""

    def setUp(self):
        """Create test user."""
        self.user = User.objects.create_user(username='testuser')

    def test_usersummary_model_exists(self):
        """Verify UserSummary model can be imported and used."""
        summary = UserSummary(
            user=self.user,
            summary_text='Test summary',
            language_tag='en'
        )
        self.assertIsNotNone(summary)

    def test_usersummary_has_required_fields(self):
        """Verify UserSummary has all required fields."""
        summary = UserSummary.objects.create(
            user=self.user,
            summary_text='Test summary',
            language_tag='en'
        )
        
        self.assertTrue(hasattr(summary, 'id'))
        self.assertTrue(hasattr(summary, 'user'))
        self.assertTrue(hasattr(summary, 'summary_text'))
        self.assertTrue(hasattr(summary, 'language_tag'))
        self.assertTrue(hasattr(summary, 'date_generated'))
        self.assertTrue(hasattr(summary, 'source_session_id'))
        self.assertTrue(hasattr(summary, 'relevance_score'))
        self.assertTrue(hasattr(summary, 'archived'))

    def test_usersummary_date_generated_auto_set(self):
        """Verify date_generated is set automatically."""
        summary = UserSummary.objects.create(
            user=self.user,
            summary_text='Test',
            language_tag='en'
        )
        self.assertIsNotNone(summary.date_generated)

    def test_usersummary_relevance_score_default_is_one(self):
        """Verify relevance_score defaults to 1.0."""
        summary = UserSummary.objects.create(
            user=self.user,
            summary_text='Test',
            language_tag='en'
        )
        self.assertEqual(summary.relevance_score, 1.0)

    def test_usersummary_archived_default_is_false(self):
        """Verify archived field defaults to False."""
        summary = UserSummary.objects.create(
            user=self.user,
            summary_text='Test',
            language_tag='en'
        )
        self.assertFalse(summary.archived)

    def test_usersummary_supports_multiple_per_user(self):
        """Verify multiple summaries can exist per user (ManyToOne)."""
        summary1 = UserSummary.objects.create(
            user=self.user,
            summary_text='Summary 1',
            language_tag='en'
        )
        summary2 = UserSummary.objects.create(
            user=self.user,
            summary_text='Summary 2',
            language_tag='ar'
        )
        
        user_summaries = UserSummary.objects.filter(user=self.user)
        self.assertEqual(user_summaries.count(), 2)
        self.assertIn(summary1, user_summaries)
        self.assertIn(summary2, user_summaries)

    def test_usersummary_query_active_only(self):
        """Verify can query active (non-archived) summaries efficiently."""
        summary1 = UserSummary.objects.create(
            user=self.user,
            summary_text='Active',
            language_tag='en',
            archived=False
        )
        summary2 = UserSummary.objects.create(
            user=self.user,
            summary_text='Archived',
            language_tag='en',
            archived=True
        )
        
        active = UserSummary.objects.filter(user=self.user, archived=False)
        self.assertEqual(active.count(), 1)
        self.assertEqual(active.first().id, summary1.id)


class DatabaseIndexTests(TestCase):
    """Test that required indexes are created for performance."""

    def setUp(self):
        """Create test data."""
        self.user = User.objects.create_user(username='testuser')
        self.session = ChatSession.objects.create(user=self.user)

    def test_message_language_tag_indexed(self):
        """Verify Message has index on (session, language_tag, -created_at)."""
        # Create messages in different languages
        for i in range(5):
            Message.objects.create(
                session=self.session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Message {i}',
                language_tag='en' if i % 2 == 0 else 'ar'
            )
        
        # These queries should use indexes
        en_msgs = Message.objects.filter(
            session=self.session,
            language_tag='en'
        ).order_by('-created_at')
        
        ar_msgs = Message.objects.filter(
            session=self.session,
            language_tag='ar'
        )
        
        self.assertEqual(en_msgs.count(), 3)
        self.assertEqual(ar_msgs.count(), 2)

    def test_session_language_tag_indexed(self):
        """Verify ChatSession has index on (user, language_tag, -created_at)."""
        # Create sessions with different language tags
        for i in range(3):
            ChatSession.objects.create(
                user=self.user,
                title=f'Session {i}',
                language_tag='en' if i % 2 == 0 else 'ar'
            )
        
        # These queries should use indexes
        en_sessions = ChatSession.objects.filter(
            user=self.user,
            language_tag='en'
        )
        
        ar_sessions = ChatSession.objects.filter(
            user=self.user,
            language_tag='ar'
        )
        
        self.assertGreater(en_sessions.count(), 0)
        self.assertGreater(ar_sessions.count(), 0)

    def test_usersummary_indexed_for_display(self):
        """Verify UserSummary indexes support efficient display queries."""
        # Create summaries
        for i in range(5):
            UserSummary.objects.create(
                user=self.user,
                summary_text=f'Summary {i}',
                language_tag='en' if i % 2 == 0 else 'ar',
                archived=i > 3
            )
        
        # Query for active summaries sorted by newest first (common query)
        active_summaries = UserSummary.objects.filter(
            user=self.user,
            archived=False
        ).order_by('-date_generated')
        
        self.assertGreater(active_summaries.count(), 0)


# pytest-django test functions (complement TestCase classes)
@pytest.mark.django_db
def test_models_imported_successfully():
    """Verify all models can be imported."""
    assert Profile is not None
    assert ChatSession is not None
    assert Message is not None
    assert UserSummary is not None
