#!/usr/bin/env python
"""
Backfill script: Tag all existing ChatMessages with language_tag='en'
This ensures all legacy messages have a language tag for filtering and grouping.

Usage:
    python backend/scripts/backfill_language_tags.py
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from chats.models import Message, ChatSession
from django.db.models import Q

def backfill_language_tags():
    """Tag all existing ChatMessages and ChatSessions with language_tag='en'."""
    
    print("Backfilling language tags for messages...")
    
    # Backfill Messages
    messages_to_update = Message.objects.filter(Q(language_tag__isnull=True) | Q(language_tag=''))
    message_count = messages_to_update.count()
    
    if message_count > 0:
        messages_to_update.update(language_tag='en')
        print(f"✓ Tagged {message_count} messages with language_tag='en'")
    else:
        print(f"✓ All {Message.objects.count()} messages already have language tags")
    
    # Backfill ChatSessions
    print("\nBackfilling language tags for sessions...")
    
    sessions_to_update = ChatSession.objects.filter(Q(language_tag__isnull=True) | Q(language_tag=''))
    session_count = sessions_to_update.count()
    
    if session_count > 0:
        sessions_to_update.update(language_tag='en')
        print(f"✓ Tagged {session_count} sessions with language_tag='en'")
    else:
        print(f"✓ All {ChatSession.objects.count()} sessions already have language tags")
    
    # Verify backfill
    print("\nVerification:")
    messages_en = Message.objects.filter(language_tag='en').count()
    messages_ar = Message.objects.filter(language_tag='ar').count()
    messages_null = Message.objects.filter(language_tag__isnull=True).count()
    
    sessions_en = ChatSession.objects.filter(language_tag='en').count()
    sessions_ar = ChatSession.objects.filter(language_tag='ar').count()
    sessions_null = ChatSession.objects.filter(language_tag__isnull=True).count()
    
    print(f"  Messages:")
    print(f"    - language_tag='en': {messages_en}")
    print(f"    - language_tag='ar': {messages_ar}")
    print(f"    - language_tag=NULL: {messages_null}")
    print(f"  ChatSessions:")
    print(f"    - language_tag='en': {sessions_en}")
    print(f"    - language_tag='ar': {sessions_ar}")
    print(f"    - language_tag=NULL: {sessions_null}")
    print(f"\nBackfill complete!")

if __name__ == '__main__':
    backfill_language_tags()
