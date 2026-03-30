#!/usr/bin/env python3
"""Test the chat export endpoint."""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from django.contrib.auth import get_user_model
from chats.models import ChatSession
from chats.services import ChatService

User = get_user_model()

# Get a test session
session = ChatSession.objects.first()
if not session:
    print("❌ No chat sessions found in database")
    sys.exit(1)

print(f"Testing export for session {session.id} (User: {session.user.username})")

# Test text export
try:
    result = ChatService.export_session(
        user=session.user,
        session_id=session.id,
        export_format='text',
        language='en'
    )
    if result.get('success', True) and 'content' in result:
        print(f"✅ Text export successful: {result['filename']}")
        print(f"   Content length: {len(result['content'])} bytes")
        print(f"   Content type: {result['content_type']}")
    else:
        print(f"❌ Text export failed: {result.get('error', 'Unknown error')}")
except Exception as e:
    print(f"❌ Text export error: {e}")

# Test PDF export
try:
    result = ChatService.export_session(
        user=session.user,
        session_id=session.id,
        export_format='pdf',
        language='en'
    )
    if result.get('success', True) and 'content' in result:
        print(f"✅ PDF export successful: {result['filename']}")
        print(f"   Content length: {len(result['content'])} bytes")
        print(f"   Content type: {result['content_type']}")
    else:
        print(f"❌ PDF export failed: {result.get('error', 'Unknown error')}")
except Exception as e:
    print(f"❌ PDF export error: {e}")

print("\n✅ Export service tests completed!")
