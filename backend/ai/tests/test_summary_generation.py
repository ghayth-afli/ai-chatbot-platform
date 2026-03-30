"""Unit tests for SummaryService."""

import pytest
from django.contrib.auth.models import User

from ai.models import UserSummary
from ai.services.summary_service import SummaryService
from chats.models import ChatSession, Message


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="summary-user",
        email="summary@example.com",
        password="pass1234",
    )


def _seed_messages(session, total=5):
    for idx in range(total):
        Message.objects.create(
            session=session,
            role='user' if idx % 2 == 0 else 'assistant',
            content=f"Message #{idx}",
            language_tag=session.language_tag,
        )


def test_generate_summary_creates_record(user):
    session = ChatSession.objects.create(
        user=user,
        title='Test Session',
        ai_model='nemotron',
        language_tag='en',
        message_count=5,
    )
    _seed_messages(session)

    def fake_ai(prompt, language, model):
        assert language == 'en'
        assert model == 'nemotron'
        return 'AI summary response'

    summary = SummaryService.generate_summary_for_session(session.id, ai_client=fake_ai)

    assert summary is not None
    assert summary.language_tag == 'en'
    assert summary.summary_text == 'AI summary response'
    assert summary.source_session_id == session.id
    assert UserSummary.objects.count() == 1


def test_generate_summary_truncates_long_text(user):
    session = ChatSession.objects.create(
        user=user,
        title='Long Session',
        ai_model='nemotron',
        language_tag='en',
        message_count=6,
    )
    _seed_messages(session, total=6)

    def verbose_ai(prompt, language, model):
        return 'x' * 5000

    summary = SummaryService.generate_summary_for_session(session.id, ai_client=verbose_ai)
    assert len(summary.summary_text) == SummaryService.MAX_SUMMARY_LENGTH


def test_generate_summary_skips_if_insufficient_messages(user):
    session = ChatSession.objects.create(
        user=user,
        title='Short Session',
        ai_model='nemotron',
        language_tag='en',
        message_count=3,
    )
    _seed_messages(session, total=3)

    summary = SummaryService.generate_summary_for_session(session.id)
    assert summary is None
    assert UserSummary.objects.count() == 0


def test_generate_summary_respects_existing_records(user):
    session = ChatSession.objects.create(
        user=user,
        title='Existing Summary Session',
        ai_model='nemotron',
        language_tag='en',
        message_count=6,
    )
    _seed_messages(session, total=6)
    UserSummary.objects.create(
        user=user,
        summary_text='Existing summary',
        language_tag='en',
        source_session_id=session.id,
    )

    summary = SummaryService.generate_summary_for_session(session.id)
    assert summary is None
    assert UserSummary.objects.count() == 1


def test_batch_generation_processes_only_missing_sessions(user):
    qualifying = ChatSession.objects.create(
        user=user,
        title='Qualifying',
        ai_model='nemotron',
        language_tag='en',
        message_count=5,
    )
    already_done = ChatSession.objects.create(
        user=user,
        title='Done',
        ai_model='nemotron',
        language_tag='ar',
        message_count=7,
    )
    _seed_messages(qualifying)
    _seed_messages(already_done, total=7)
    UserSummary.objects.create(
        user=user,
        summary_text='Existing summary',
        language_tag='ar',
        source_session_id=already_done.id,
    )

    def fake_ai(prompt, language, model):
        return f"Summary for {language}"

    created = SummaryService.batch_generate_summaries(ai_client=fake_ai)

    assert len(created) == 1
    assert created[0].source_session_id == qualifying.id
    assert UserSummary.objects.count() == 2  # existing + new


def test_batch_generation_falls_back_when_ai_errors(user):
    session = ChatSession.objects.create(
        user=user,
        title='Fallback Session',
        ai_model='nemotron',
        language_tag='ar',
        message_count=5,
    )
    _seed_messages(session)

    def failing_ai(prompt, language, model):
        raise RuntimeError('Boom')

    summary = SummaryService.generate_summary_for_session(session.id, ai_client=failing_ai)
    assert summary is not None
    assert len(summary.summary_text) > 0
    assert summary.language_tag == 'ar'


def test_batch_generation_uses_session_language_or_message_tag(user):
    session = ChatSession.objects.create(
        user=user,
        title='Language Resolve',
        ai_model='nemotron',
        language_tag='',
        message_count=5,
    )
    for idx in range(5):
        Message.objects.create(
            session=session,
            role='user',
            content=f"مسألة {idx}",
            language_tag='ar',
        )

    def fake_ai(prompt, language, model):
        assert language == 'ar'
        return 'Arabic summary'

    summary = SummaryService.generate_summary_for_session(session.id, ai_client=fake_ai)
    assert summary.language_tag == 'ar'
