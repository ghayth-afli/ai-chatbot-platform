"""
Management Command: Generate Summaries

Usage:
    python manage.py generate_summaries
    
Description:
    Triggers batch summary generation for all sessions with 5+ messages
    that don't already have summaries.
    
Options:
    --verbose: Show detailed progress for each session
    --limit N: Limit processing to N sessions (for testing)
"""

import logging

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from ai.tasks import summarize_completed_sessions

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate AI summaries for chat sessions with 5+ messages'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed progress for each session',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit processing to N sessions',
        )

    def handle(self, *args, **options):
        verbose = options['verbose']
        limit = options['limit']

        if verbose:
            self.stdout.write(
                self.style.SUCCESS('Starting summary generation...')
            )
            self.stdout.write(f'Timestamp: {timezone.now()}')

        try:
            # Call batch generation with optional limit
            summaries = summarize_completed_sessions(limit=limit)

            # Report results
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Successfully generated {len(summaries)} summaries'
                )
            )

            if verbose:
                for summary in summaries:
                    self.stdout.write(
                        f'  - Session {summary.source_session_id} '
                        f'({summary.language_tag}): '
                        f'{len(summary.summary_text)} chars'
                    )

            self.stdout.write(f'Completed at: {timezone.now()}')

        except Exception as e:
            logger.error(f'Error generating summaries: {e}')
            raise CommandError(f'Failed to generate summaries: {e}')
