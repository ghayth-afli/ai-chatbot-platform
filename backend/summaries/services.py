"""
Summary Generation Service

Generates AI-powered summaries of user chat patterns and interests
based on their message history.
"""

import logging
from typing import Dict, Any
from django.contrib.auth.models import User
from django.utils import timezone

from chats.models import Message
from chats.router import dispatch_to_provider
from .models import UserSummary

logger = logging.getLogger(__name__)


class SummaryService:
    """Service for generating user profile summaries"""

    SUMMARY_GENERATION_PROMPT_TEMPLATE = """
You are analyzing a user's chat history to generate a brief profile summary.

Recent messages from the user:
{messages}

Based on this chat history, generate a 2-3 sentence summary of the user's interests, topics they're curious about, and communication style.

Be concise and focus on patterns and themes. Format as plain text, not bullet points.
"""

    @staticmethod
    def generate_summary(user: User, language: str = 'en') -> Dict[str, Any]:
        """
        Generate an AI summary of user's chat patterns.

        Args:
            user: User instance
            language: Language code ('en' or 'ar')

        Returns:
            Dict with 'summary' and 'message_count' keys
        """
        # Collect recent messages from this user
        recent_messages = Message.objects.filter(
            session__user=user,
            role='user'  # Only analyze user messages
        ).order_by('-created_at')[:50]  # Last 50 user messages

        if not recent_messages:
            return {
                'summary': 'No chat history to summarize yet. Start chatting to generate a profile.',
                'message_count': 0,
            }

        # Prepare messages for summarization
        messages_text = '\n'.join([
            f"- {msg.content[:200]}"  # Truncate long messages
            for msg in reversed(recent_messages)  # Reverse to chronological order
        ])

        prompt = SummaryService.SUMMARY_GENERATION_PROMPT_TEMPLATE.format(
            messages=messages_text
        )

        # Call AI provider to generate summary
        result = dispatch_to_provider(
            'Nemotron',  # Use Nemotron for summary generation
            prompt,
            system_prompt='You are a helpful assistant that analyzes user chat patterns to create brief, insightful profile summaries.'
        )

        if 'error' in result:
            logger.error(f'Summary generation error for user {user.id}: {result["error"]}')
            return {
                'summary': 'Unable to generate summary at this time.',
                'message_count': 0,
                'error': result['error'],
            }

        # Store summary in database
        summary_text = result.get('response', '')
        total_user_messages = Message.objects.filter(
            session__user=user,
            role='user'
        ).count()

        try:
            user_summary, created = UserSummary.objects.update_or_create(
                user=user,
                defaults={
                    'summary': summary_text,
                    'message_count_at_summary': total_user_messages,
                }
            )

            logger.info(
                f'Generated summary for user {user.id} '
                f'({total_user_messages} messages total)'
            )

            return {
                'summary': summary_text,
                'message_count': total_user_messages,
                'created': created,
                'last_updated': user_summary.last_updated.isoformat(),
            }

        except Exception as e:
            logger.error(f'Error saving summary for user {user.id}: {str(e)}')
            return {
                'summary': summary_text,
                'message_count': total_user_messages,
                'error': 'Summary generated but not saved',
            }

    @staticmethod
    def get_user_summary(user: User) -> Dict[str, Any]:
        """
        Retrieve existing summary for a user.

        Args:
            user: User instance

        Returns:
            Dict with summary data or empty dict if not found
        """
        try:
            summary = UserSummary.objects.get(user=user)
            return {
                'summary': summary.summary,
                'generated_at': summary.generated_at.isoformat(),
                'last_updated': summary.last_updated.isoformat(),
                'message_count_at_summary': summary.message_count_at_summary,
            }
        except UserSummary.DoesNotExist:
            return {}
