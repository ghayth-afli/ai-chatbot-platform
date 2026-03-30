"""
Summary Service

Provides utilities for:
- AI summary generation from chat history
- Batch summary processing
- Summary storage and retrieval

This service integrates with existing AI backend to generate
user interaction summaries in their preferred language.
"""

import logging
from django.utils import timezone
from chats.models import ChatSession, Message
from ai.models import UserSummary
from ai.services.language_service import LanguageService

logger = logging.getLogger(__name__)


class SummaryService:
    """Service for generating and managing user summaries."""

    MIN_MESSAGES_FOR_SUMMARY = 5
    MAX_SUMMARY_LENGTH = 2000

    @staticmethod
    def generate_summary_for_session(session_id, ai_client=None):
        """
        Generate an AI summary for a specific chat session.
        
        Args:
            session_id: ChatSession.id
            ai_client: Optional AI client instance (defaults to platform's AI service)
            
        Returns:
            UserSummary instance if successful, None if failed
        """
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            logger.error(f"ChatSession {session_id} not found")
            return None

        # Retrieve session messages
        messages = Message.objects.filter(
            session=session
        ).order_by('created_at')

        if messages.count() < SummaryService.MIN_MESSAGES_FOR_SUMMARY:
            logger.warning(f"Session {session_id} has insufficient messages ({messages.count()}) for summary")
            return None

        # Build message history for AI prompt
        history = SummaryService._format_message_history(messages)

        # Prepare AI prompt
        prompt = SummaryService._build_summary_prompt(history, session.language_tag)

        # Call AI service (TODO: integrate with actual AI backend)
        try:
            # This is a placeholder - replace with actual AI client call
            # summary_text = ai_client.generate(prompt, language=session.language_tag)
            summary_text = "[PLACEHOLDER: AI summary would be generated here]"
            
            if not summary_text or len(summary_text) == 0:
                logger.warning(f"AI generated empty summary for session {session_id}")
                return None

            # Truncate if necessary
            if len(summary_text) > SummaryService.MAX_SUMMARY_LENGTH:
                summary_text = summary_text[:SummaryService.MAX_SUMMARY_LENGTH]

            # Create and store UserSummary
            user_summary = UserSummary(
                user=session.user,
                summary_text=summary_text,
                language_tag=session.language_tag or 'en',
                date_generated=timezone.now(),
                source_session_id=session_id,
                relevance_score=1.0,
                archived=False
            )
            user_summary.save()

            logger.info(f"Generated summary for session {session_id} for user {session.user.id}")
            return user_summary

        except Exception as e:
            logger.error(f"Error generating summary for session {session_id}: {e}")
            return None

    @staticmethod
    def batch_generate_summaries():
        """
        Generate summaries for all sessions that need them.
        
        Sessions that qualify:
        - message_count >= MIN_MESSAGES_FOR_SUMMARY
        - No corresponding UserSummary exists yet
        
        Returns:
            List of created UserSummary instances
        """
        created_summaries = []

        # Find sessions with 5+ messages that don't have summaries yet
        sessions_needing_summary = ChatSession.objects.filter(
            message_count__gte=SummaryService.MIN_MESSAGES_FOR_SUMMARY
        ).exclude(
            id__in=UserSummary.objects.filter(
                source_session_id__isnull=False
            ).values_list('source_session_id', flat=True)
        )

        logger.info(f"Found {sessions_needing_summary.count()} sessions needing summaries")

        for session in sessions_needing_summary:
            summary = SummaryService.generate_summary_for_session(session.id)
            if summary:
                created_summaries.append(summary)

        logger.info(f"Batch generated {len(created_summaries)} summaries")
        return created_summaries

    @staticmethod
    def _format_message_history(messages):
        """
        Format message history for AI summarization prompt.
        
        Args:
            messages: QuerySet of Message objects
            
        Returns:
            Formatted string of conversation history
        """
        formatted = []
        for msg in messages:
            role = "User" if msg.role == 'user' else "Assistant"
            formatted.append(f"{role}: {msg.content}")
        
        return "\n".join(formatted)

    @staticmethod
    def _build_summary_prompt(history, language='en'):
        """
        Build AI prompt for summarization.
        
        Args:
            history: Formatted message history
            language: Language code ('en' or 'ar')
            
        Returns:
            Complete AI prompt string
        """
        if language == 'ar':
            system_instruction = LanguageService.get_msa_prompt_instruction()
            user_prompt = f"""قم بتلخيص محادثة المستخدم التالية بـ 1-3 جمل قصيرة.
ركز على:
- المواضيع الرئيسية التي سأل عنها المستخدم
- أنماط الاهتمامات
- أي رؤى حول أسلوب الاستخدام

المحادثة:
{history}

الملخص:"""
        else:
            system_instruction = "You are a helpful assistant that summarizes user interactions."
            user_prompt = f"""Please summarize the following conversation in 1-3 brief sentences.
Focus on:
- Main topics the user asked about
- Patterns of interests
- Any insights about usage patterns

Conversation:
{history}

Summary:"""

        return f"{system_instruction}\n\n{user_prompt}"


__all__ = ['SummaryService']
