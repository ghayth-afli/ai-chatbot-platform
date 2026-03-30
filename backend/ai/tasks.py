"""Asynchronous-style task stubs for AI summary workflows."""

import logging
from typing import Optional

from ai.models import UserSummary
from ai.services.summary_service import SummaryService

logger = logging.getLogger(__name__)


def summarize_completed_sessions(limit: Optional[int] = None):
    """
    Batch generate summaries for all sessions that qualify.
    
    Triggered:
    - Manually via management command: `python manage.py generate_summaries`
    - On ChatMessage creation when session.message_count reaches 5
    - Periodically via APScheduler or Celery beat
    
    Optional limit parameter restricts the number of sessions processed in one run.

    For Celery integration (future), decorate with:
    @app.task(name='ai.tasks.summarize_completed_sessions')
    
    For APScheduler integration, call from scheduled job.
    """
    try:
        logger.info("Starting batch summary generation...")
        summaries = SummaryService.batch_generate_summaries(limit=limit)
        logger.info(f"Completed batch summary generation: {len(summaries)} summaries created")
        return summaries
    except Exception as e:
        logger.error(f"Error in summarize_completed_sessions: {e}")
        raise


def generate_summary_for_session_task(session_id: int) -> Optional[UserSummary]:
    """Trigger summary generation for a single chat session."""
    logger.info("Queueing summary generation for session %s", session_id)
    try:
        summary = SummaryService.generate_summary_for_session(session_id)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(
            "Summary generation failed for session %s: %s",
            session_id,
            exc,
        )
        raise

    if summary:
        logger.info("Summary %s created for session %s", summary.id, session_id)
    else:
        logger.info("No summary created for session %s (insufficient data)", session_id)
    return summary


__all__ = ['summarize_completed_sessions', 'generate_summary_for_session_task']


# For future Celery integration:
# Example configuration would look like:
#
# from celery import shared_task
#
# @shared_task
# def summarize_completed_sessions_celery():
#     """Celery-wrapped version of summarize_completed_sessions."""
#     return summarize_completed_sessions()
#
# Then in celery beat schedule:
# app.conf.beat_schedule = {
#     'summarize-completed-sessions': {
#         'task': 'ai.tasks.summarize_completed_sessions_celery',
#         'schedule': crontab(minute='*/1'),  # Every 1 minute
#     },
# }
