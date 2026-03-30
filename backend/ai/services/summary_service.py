"""Utilities for generating AI-backed user summaries."""

from __future__ import annotations

import logging
from typing import Callable, Iterable, List, Optional

from django.db.models import Exists, OuterRef
from django.utils import timezone

from ai.models import UserSummary
from ai.services.language_service import LanguageService
from chats.models import ChatSession, Message
from chats.router import dispatch_to_provider

logger = logging.getLogger(__name__)


class SummaryService:
    """Service helpers for summary generation and storage."""

    MIN_MESSAGES_FOR_SUMMARY = 5
    MAX_SUMMARY_LENGTH = 2000
    DEFAULT_MODEL = 'nemotron'

    @staticmethod
    def generate_summary_for_session(
        session_id: int,
        ai_client: Optional[Callable[[str, str, str], str]] = None,
    ) -> Optional[UserSummary]:
        """Create or return a summary for the provided chat session."""
        try:
            session = ChatSession.objects.select_related('user').get(id=session_id)
        except ChatSession.DoesNotExist:
            logger.error("ChatSession %s not found", session_id)
            return None

        messages = list(
            Message.objects.filter(session=session).order_by('created_at')
        )
        if len(messages) < SummaryService.MIN_MESSAGES_FOR_SUMMARY:
            logger.debug(
                "Session %s has %s messages; skipping summary",
                session_id,
                len(messages),
            )
            return None

        language = SummaryService._resolve_language(session, messages)
        existing_summary = (
            UserSummary.objects.filter(source_session_id=session_id)
            .order_by('-date_generated')
            .first()
        )
        if existing_summary:
            already_in_language = existing_summary.language_tag == language
            has_content = bool((existing_summary.summary_text or '').strip())
            if already_in_language and has_content:
                logger.debug(
                    "Session %s already summarized in %s; skipping",
                    session_id,
                    language,
                )
                return None

        prompt = SummaryService._build_summary_prompt(messages, language)
        ai_client = ai_client or SummaryService._call_model_completion

        try:
            summary_text = ai_client(prompt, language, session.ai_model or SummaryService.DEFAULT_MODEL)
        except Exception as exc:  # pragma: no cover - fallback path tested separately
            logger.warning(
                "AI provider failed for session %s (%s). Falling back to heuristic summary: %s",
                session_id,
                type(exc).__name__,
                exc,
            )
            summary_text = SummaryService._fallback_summary(messages, language)

        if not summary_text:
            summary_text = SummaryService._fallback_summary(messages, language)

        if len(summary_text) > SummaryService.MAX_SUMMARY_LENGTH:
            summary_text = summary_text[: SummaryService.MAX_SUMMARY_LENGTH]

        normalized_text = summary_text.strip()

        if existing_summary:
            existing_summary.summary_text = normalized_text
            existing_summary.language_tag = language
            existing_summary.date_generated = timezone.now()
            existing_summary.relevance_score = 1.0
            existing_summary.archived = False
            existing_summary.save(
                update_fields=[
                    'summary_text',
                    'language_tag',
                    'date_generated',
                    'relevance_score',
                    'archived',
                ]
            )
            logger.info(
                "Updated summary %s for session %s to match latest language",
                existing_summary.id,
                session_id,
            )
            return existing_summary

        summary = UserSummary.objects.create(
            user=session.user,
            summary_text=normalized_text,
            language_tag=language,
            date_generated=timezone.now(),
            source_session_id=session.id,
            relevance_score=1.0,
            archived=False,
        )
        logger.info("Generated summary %s for session %s", summary.id, session_id)
        return summary

    @staticmethod
    def batch_generate_summaries(
        ai_client: Optional[Callable[[str, str, str], str]] = None,
        limit: Optional[int] = None,
    ) -> List[UserSummary]:
        """Generate summaries for every qualifying session, up to the provided limit."""
        sessions = (
            ChatSession.objects.select_related('user')
            .filter(message_count__gte=SummaryService.MIN_MESSAGES_FOR_SUMMARY)
            .annotate(
                has_summary=Exists(
                    UserSummary.objects.filter(source_session_id=OuterRef('pk'))
                )
            )
            .filter(has_summary=False)
            .order_by('created_at')
        )

        if limit:
            sessions = sessions[:limit]

        created: List[UserSummary] = []
        for session in sessions:
            summary = SummaryService.generate_summary_for_session(
                session.id,
                ai_client=ai_client,
            )
            if summary:
                created.append(summary)

        logger.info("Batch generated %s summaries", len(created))
        return created

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _resolve_language(session: ChatSession, messages: Iterable[Message]) -> str:
        if session.language_tag:
            return session.language_tag
        for message in messages:
            if message.language_tag:
                return message.language_tag
        return 'en'

    @staticmethod
    def _build_summary_prompt(messages: Iterable[Message], language: str) -> str:
        history = SummaryService._format_message_history(messages)
        if not history:
            history = 'No conversation history provided.'

        if language == 'ar':
            return (
                "قم بتلخيص المحادثة التالية في 2-3 جمل رسمية باللغة العربية الفصحى.\n"
                "- اذكر المواضيع الأبرز.\n"
                "- صف أسلوب الاستخدام أو النمط المتكرر.\n"
                "- كن موجزاً وواضحاً.\n\n"
                f"المحادثة:\n{history}\n\nالملخص:" 
            )

        return (
            "Summarize the conversation below in 2-3 concise sentences.\n"
            "- Highlight the primary topics.\n"
            "- Describe usage patterns or goals.\n"
            "- Maintain a professional tone.\n\n"
            f"Conversation:\n{history}\n\nSummary:" 
        )

    @staticmethod
    def _call_model_completion(prompt: str, language: str, model: str) -> str:
        system_prompt = (
            LanguageService.get_msa_prompt_instruction()
            if language == 'ar'
            else "You are an assistant that produces structured, professional summaries."
        )
        model_id = model or SummaryService.DEFAULT_MODEL
        result = dispatch_to_provider(model_id, prompt, system_prompt)
        if not result or 'error' in result:
            raise RuntimeError(result.get('error') if isinstance(result, dict) else 'AI call failed')
        return (result.get('response') or '').strip()

    @staticmethod
    def _fallback_summary(messages: Iterable[Message], language: str) -> str:
        user_topics = [msg.content for msg in messages if msg.role == 'user']
        assistant_notes = [msg.content for msg in messages if msg.role == 'assistant']

        if language == 'ar':
            intro = "تركزت المحادثة حول"
            tail = "وقد قدم النظام إرشادات متتابعة بناءً على هذه الأسئلة."
        else:
            intro = "The conversation focused on"
            tail = "and the assistant responded with guidance tailored to those themes."

        if user_topics:
            topic_slice = ', '.join(user_topics[:2])
        else:
            topic_slice = 'general inquiries'

        if assistant_notes:
            support_slice = assistant_notes[0][:140].strip()
        else:
            support_slice = ''

        parts = [f"{intro} {topic_slice}"]
        if support_slice:
            parts.append(support_slice)
        parts.append(tail)
        return ' '.join(parts)

    @staticmethod
    def _format_message_history(messages: Iterable[Message]) -> str:
        """Return a normalized transcript ready for LLM prompts."""
        lines: List[str] = []
        for message in messages:
            content = (message.content or '').strip()
            if not content:
                continue
            role = 'User' if message.role == 'user' else 'Assistant'
            lines.append(f"{role}: {content}")
        return "\n".join(lines)


__all__ = ['SummaryService']
