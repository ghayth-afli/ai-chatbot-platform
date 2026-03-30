"""
Django Signals for AI App

Handles automatic actions triggered by model changes:
- Increment message_count on ChatSession when new ChatMessage is created
- Trigger summary generation task when message_count reaches 5
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from chats.models import Message, ChatSession
from ai.tasks import generate_summary_for_session_task
from ai.services.summary_service import SummaryService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Message)
def increment_session_message_count(sender, instance, created, **kwargs):
    """
    Signal handler: Increment message_count on ChatSession after new message.
    
    This runs after every Message is saved. We only care about creation (created=True)
    to avoid double-counting if a message is edited.
    
    If message_count reaches 5, trigger summary generation task.
    """
    if not created:
        # Only process new messages, not edits
        return

    try:
        session = instance.session
        
        # Increment message count
        session.message_count += 1
        session.save(update_fields=['message_count'])
        
        logger.debug(f"Incremented message_count for session {session.id} to {session.message_count}")
        
        if session.message_count == SummaryService.MIN_MESSAGES_FOR_SUMMARY:
            logger.info(
                "Session %s reached summary threshold (%s messages), triggering generation",
                session.id,
                SummaryService.MIN_MESSAGES_FOR_SUMMARY,
            )
            trigger_summary_generation_task(session.id)
            
    except ChatSession.DoesNotExist:
        logger.error(f"ChatSession not found for message {instance.id}")
    except Exception as e:
        logger.error(f"Error incrementing message_count for session: {e}")


def trigger_summary_generation_task(session_id):
    """Generate a summary for the session immediately (best-effort)."""

    try:
        generate_summary_for_session_task(session_id)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(
            "Error generating summary for session %s: %s",
            session_id,
            exc,
        )
