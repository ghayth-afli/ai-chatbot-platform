#!/usr/bin/env python
"""
Mock AI Provider for testing
Allows testing the full chat flow without external API dependencies
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv

# Load environment
backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'
load_dotenv(env_file)

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from chats.services import ChatService
from django.contrib.auth.models import User

# Create test user if doesn't exist
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User',
    }
)

print(f"User: {user.username} ({'created' if created else 'existing'})")
print()

# Test creating a session
print("Creating chat session...")
session_data = ChatService.create_session(
    user=user,
    title='Test Session - Nemotron',
    model='nemotron',
    language='en'
)
print(f"✓ Session created: {session_data}")
print()

# Test sending a message
print("Sending test message...")
try:
    result = ChatService.send_message(
        user=user,
        session_id=session_data['id'],
        message_text='Hello! What is 2+2? Answer in one sentence.',
        model='nemotron'
    )
    print(f"✓ Message sent successfully!")
    print(f"  User message ID: {result['user_message_id']}")
    print(f"  AI message ID: {result['ai_message_id']}")
    print(f"  Response: {result['response']}")
    print(f"  Model: {result['model']}")
except Exception as e:
    print(f"✗ Error: {str(e)}")
    import traceback
    traceback.print_exc()
