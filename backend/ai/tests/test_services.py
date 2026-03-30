"""
Unit tests for multilingual services.

Tests verify:
- Language validation functions
- Localized error message retrieval (English + Arabic)
- MSA system prompt generation
- RTL direction helpers
- Summary service generation logic
- Summary batch processing
- Message formatting for AI prompts
"""

import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from datetime import datetime

from chats.models import ChatSession, Message
from ai.models import UserSummary
from ai.services.language_service import LanguageService
from ai.services.summary_service import SummaryService
from ai import signals as ai_signals


class DisableSummarySignalsMixin:
    """Temporarily disable summary generation signals for deterministic tests."""

    _signals_disconnected = False

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._signals_disconnected = post_save.disconnect(
            ai_signals.increment_session_message_count,
            sender=Message,
        )

    @classmethod
    def tearDownClass(cls):
        if cls._signals_disconnected:
            post_save.connect(
                ai_signals.increment_session_message_count,
                sender=Message,
            )
        super().tearDownClass()


class LanguageServiceValidationTests(TestCase):
    """Test language validation in language_service."""

    def test_validate_language_code_en_returns_true(self):
        """Verify validate_language_code('en') returns True."""
        result = LanguageService.validate_language_code('en')
        self.assertTrue(result)

    def test_validate_language_code_ar_returns_true(self):
        """Verify validate_language_code('ar') returns True."""
        result = LanguageService.validate_language_code('ar')
        self.assertTrue(result)

    def test_validate_language_code_invalid_returns_false(self):
        """Verify validate_language_code('ja') returns False."""
        result = LanguageService.validate_language_code('ja')
        self.assertFalse(result)

    def test_validate_language_code_uppercase_returns_false(self):
        """Verify validate_language_code('AR') returns False (case-sensitive)."""
        result = LanguageService.validate_language_code('AR')
        self.assertFalse(result)

    def test_validate_language_code_empty_returns_false(self):
        """Verify validate_language_code('') returns False."""
        result = LanguageService.validate_language_code('')
        self.assertFalse(result)

    def test_validate_language_code_none_returns_false(self):
        """Verify validate_language_code(None) returns False."""
        result = LanguageService.validate_language_code(None)
        self.assertFalse(result)


class LanguageServiceLocalizationTests(TestCase):
    """Test localized error message retrieval."""

    def test_get_localized_error_message_rate_limit_en(self):
        """Verify English rate limit error message exists."""
        msg = LanguageService.get_localized_error_message('rate_limit_error', 'en')
        self.assertIsNotNone(msg)
        self.assertIsInstance(msg, str)
        self.assertGreater(len(msg), 0)
        # Should mention rate limit
        self.assertIn('rate', msg.lower())

    def test_get_localized_error_message_rate_limit_ar(self):
        """Verify Arabic rate limit error message exists."""
        msg = LanguageService.get_localized_error_message('rate_limit_error', 'ar')
        self.assertIsNotNone(msg)
        self.assertIsInstance(msg, str)
        self.assertGreater(len(msg), 0)

    def test_get_localized_error_message_provider_rate_limit_en(self):
        """Verify provider rate limit message exists in English."""
        msg = LanguageService.get_localized_error_message('provider_rate_limit_error', 'en', minutes=5)
        self.assertIsNotNone(msg)
        self.assertIsInstance(msg, str)
        self.assertIn('OpenRouter', msg)

    def test_get_localized_error_message_provider_rate_limit_ar(self):
        """Verify provider rate limit message exists in Arabic."""
        msg = LanguageService.get_localized_error_message('provider_rate_limit_error', 'ar', minutes=5)
        self.assertIsNotNone(msg)
        self.assertIsInstance(msg, str)
        self.assertGreater(len(msg), 0)

    def test_get_localized_error_message_invalid_error_en(self):
        """Verify invalid error code returns default English message."""
        msg = LanguageService.get_localized_error_message('invalid_error_code_xyz', 'en')
        self.assertIsNotNone(msg)
        self.assertIsInstance(msg, str)

    def test_get_localized_error_message_invalid_language(self):
        """Verify invalid language code returns English message."""
        msg = LanguageService.get_localized_error_message('rate_limit_error', 'de')
        self.assertIsNotNone(msg)
        self.assertIsInstance(msg, str)

    def test_localized_error_messages_are_distinct(self):
        """Verify English and Arabic messages are different."""
        msg_en = LanguageService.get_localized_error_message('rate_limit_error', 'en')
        msg_ar = LanguageService.get_localized_error_message('rate_limit_error', 'ar')
        self.assertNotEqual(msg_en, msg_ar)

    def test_get_localized_error_message_unavailable_error_code(self):
        """Verify missing error codes are handled gracefully."""
        # Should not raise exception, returns some message
        msg = LanguageService.get_localized_error_message('unknown_error', 'en')
        self.assertIsNotNone(msg)


class LanguageServiceMSATests(TestCase):
    """Test Modern Standard Arabic system prompt generation."""

    def test_get_msa_system_prompt_returns_string(self):
        """Verify get_msa_system_prompt returns a string."""
        prompt = LanguageService.get_msa_prompt_instruction()
        self.assertIsNotNone(prompt)
        self.assertIsInstance(prompt, str)

    def test_get_msa_system_prompt_contains_instruction(self):
        """Verify MSA prompt contains Arabic language instruction."""
        prompt = LanguageService.get_msa_prompt_instruction()
        # Should mention Modern Standard Arabic, Formal, or similar
        self.assertGreater(len(prompt), 20)
        # Generally should reference Arabic or MSA
        prompt_lower = prompt.lower()
        self.assertTrue(
            'arabic' in prompt_lower or 'msa' in prompt_lower or 'formal' in prompt_lower
        )

    def test_get_msa_system_prompt_consistent(self):
        """Verify MSA prompt is consistent across calls."""
        prompt1 = LanguageService.get_msa_prompt_instruction()
        prompt2 = LanguageService.get_msa_prompt_instruction()
        self.assertEqual(prompt1, prompt2)


class LanguageServiceDirectionTests(TestCase):
    """Test text direction helpers."""

    def test_get_text_direction_en_returns_ltr(self):
        """Verify English returns 'ltr' direction."""
        direction = LanguageService.get_ishtml_dir_attribute('en')
        self.assertEqual(direction, 'ltr')

    def test_get_text_direction_ar_returns_rtl(self):
        """Verify Arabic returns 'rtl' direction."""
        direction = LanguageService.get_ishtml_dir_attribute('ar')
        self.assertEqual(direction, 'rtl')


class SummaryServiceMessageFormattingTests(TestCase):
    """Test message formatting for AI prompts."""

    def setUp(self):
        """Create test user and session."""
        self.user = User.objects.create_user(username='testuser')
        self.session = ChatSession.objects.create(
            user=self.user,
            title='Test Chat'
        )

    def test_format_messages_for_prompt_empty_session(self):
        """Verify format_messages_for_prompt handles empty sessions."""
        messages = Message.objects.filter(session=self.session)
        result = SummaryService._format_message_history(messages)
        self.assertIsNotNone(result)
        self.assertIsInstance(result, str)

    def test_format_messages_for_prompt_single_message(self):
        """Verify format_messages_for_prompt handles single message."""
        msg = Message.objects.create(
            session=self.session,
            role='user',
            content='Hello'
        )
        messages = Message.objects.filter(session=self.session)
        result = SummaryService._format_message_history(messages)
        self.assertIn('Hello', result)

    def test_format_messages_for_prompt_multiple_messages(self):
        """Verify format_messages_for_prompt includes all messages."""
        msg1 = Message.objects.create(
            session=self.session,
            role='user',
            content='Hello'
        )
        msg2 = Message.objects.create(
            session=self.session,
            role='assistant',
            content='HiThere'
        )
        messages = Message.objects.filter(session=self.session)
        result = SummaryService._format_message_history(messages)
        self.assertIn('Hello', result)
        self.assertIn('HiThere', result)


class SummaryServiceGenerationTests(DisableSummarySignalsMixin, TestCase):
    """Test summary generation logic."""

    def setUp(self):
        """Create test user and session."""
        self.user = User.objects.create_user(username='testuser')
        self.session = ChatSession.objects.create(
            user=self.user,
            title='Test Chat',
            language_tag='en'
        )

    def test_generate_summary_for_session_returns_user_summary(self):
        """Verify generate_summary_for_session returns UserSummary instance."""
        # Add messages to session
        for i in range(5):
            Message.objects.create(
                session=self.session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Message {i}',
                language_tag='en'
            )
        
        result = SummaryService.generate_summary_for_session(self.session.id)
        self.assertIsNotNone(result)
        self.assertIsInstance(result, UserSummary)

    def test_generate_summary_for_session_sets_user(self):
        """Verify summary is linked to correct user."""
        for i in range(5):
            Message.objects.create(
                session=self.session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Message {i}'
            )
        
        result = SummaryService.generate_summary_for_session(self.session.id)
        self.assertEqual(result.user, self.user)

    def test_generate_summary_for_session_sets_language_tag(self):
        """Verify summary inherits session language_tag."""
        for i in range(5):
            Message.objects.create(
                session=self.session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Message {i}',
                language_tag='ar'
            )
        
        self.session.language_tag = 'ar'
        self.session.save()
        
        result = SummaryService.generate_summary_for_session(self.session.id)
        self.assertEqual(result.language_tag, 'ar')

    def test_generate_summary_for_session_sets_source_session_id(self):
        """Verify summary stores source session ID."""
        for i in range(5):
            Message.objects.create(
                session=self.session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Message {i}'
            )
        
        result = SummaryService.generate_summary_for_session(self.session.id)
        self.assertEqual(result.source_session_id, self.session.id)


class SummaryServiceBatchProcessingTests(DisableSummarySignalsMixin, TestCase):
    """Test batch summary generation."""

    def setUp(self):
        """Create test data."""
        self.user = User.objects.create_user(username='testuser')

    def test_batch_generate_summaries_returns_list(self):
        """Verify batch_generate_summaries returns a list."""
        result = SummaryService.batch_generate_summaries()
        self.assertIsInstance(result, list)

    def test_batch_generate_summaries_empty_sessions(self):
        """Verify batch_generate_summaries handles no sessions."""
        result = SummaryService.batch_generate_summaries()
        self.assertEqual(result, [])

    def test_batch_generate_summaries_skips_small_sessions(self):
        """Verify short sessions (<5 messages) are skipped."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Short Chat',
            message_count=3
        )
        # Add only 3 messages (less than 5 threshold)
        for i in range(3):
            Message.objects.create(
                session=session,
                role='user',
                content=f'Message {i}'
            )
        
        result = SummaryService.batch_generate_summaries()
        self.assertEqual(len(result), 0)

    def test_batch_generate_summaries_processes_qualifying_sessions(self):
        """Verify sessions with 5+ messages are processed."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Long Chat',
            message_count=6
        )
        # Add 6 messages (exceeds 5 threshold)
        for i in range(6):
            Message.objects.create(
                session=session,
                role='user' if i % 2 == 0 else 'assistant',
                content=f'Message {i}'
            )
        
        result = SummaryService.batch_generate_summaries()
        self.assertGreater(len(result), 0)

    def test_batch_generate_summaries_multiple_sessions(self):
        """Verify multiple qualifying sessions are processed."""
        # Create 3 sessions, 2 qualifying
        for j in range(2):
            session = ChatSession.objects.create(
                user=self.user,
                title=f'Chat {j}',
                message_count=6
            )
            # 6 messages each (qualifying)
            for i in range(6):
                Message.objects.create(
                    session=session,
                    role='user' if i % 2 == 0 else 'assistant',
                    content=f'Session {j} Message {i}'
                )
        
        # Small session (non-qualifying)
        small_session = ChatSession.objects.create(
            user=self.user,
            title='Short Chat',
            message_count=2
        )
        for i in range(2):
            Message.objects.create(
                session=small_session,
                role='user',
                content=f'Short message {i}'
            )
        
        result = SummaryService.batch_generate_summaries()
        self.assertEqual(len(result), 2)

    def test_batch_generate_summaries_respects_limit(self):
        """Verify optional limit restricts the number of processed sessions."""
        for j in range(3):
            session = ChatSession.objects.create(
                user=self.user,
                title=f'Limited Chat {j}',
                message_count=SummaryService.MIN_MESSAGES_FOR_SUMMARY,
            )
            for i in range(SummaryService.MIN_MESSAGES_FOR_SUMMARY):
                Message.objects.create(
                    session=session,
                    role='user' if i % 2 == 0 else 'assistant',
                    content=f'Limited session {j} message {i}',
                )

        result = SummaryService.batch_generate_summaries(limit=1)
        self.assertEqual(len(result), 1)


class ServiceExceptionHandlingTests(TestCase):
    """Test error handling in services."""

    def setUp(self):
        """Create test user."""
        self.user = User.objects.create_user(username='testuser')

    def test_validate_language_code_handles_special_characters(self):
        """Verify validate_language_code handles special characters safely."""
        result = LanguageService.validate_language_code('en; DROP TABLE users;')
        self.assertFalse(result)

    def test_get_localized_error_message_handles_special_characters(self):
        """Verify get_localized_error_message handles special characters safely."""
        msg = LanguageService.get_localized_error_message('valid_code', 'en<script>')
        self.assertIsNotNone(msg)

    def test_batch_generate_summaries_handles_deleted_session(self):
        """Verify batch process doesn't fail if session is deleted during processing."""
        session = ChatSession.objects.create(
            user=self.user,
            title='Temp Chat',
            message_count=6
        )
        for i in range(6):
            Message.objects.create(
                session=session,
                role='user',
                content=f'Message {i}'
            )
        
        session_id = session.id
        session.delete()
        
        # Should not raise exception
        result = SummaryService.batch_generate_summaries()
        self.assertIsInstance(result, list)


# pytest-django tests
@pytest.mark.django_db
def test_language_service_functions_exist():
    """Verify all language service methods exist."""
    assert callable(LanguageService.validate_language_code)
    assert callable(LanguageService.get_localized_error_message)
    assert callable(LanguageService.get_msa_prompt_instruction)
    assert callable(LanguageService.get_ishtml_dir_attribute)


@pytest.mark.django_db
def test_summary_service_functions_exist():
    """Verify all summary service methods exist."""
    assert callable(SummaryService.generate_summary_for_session)
    assert callable(SummaryService.batch_generate_summaries)
    assert callable(SummaryService._format_message_history)
