#!/usr/bin/env python
"""Manual chat service smoke test (kept for developers to run directly)."""

import os
import sys
from pathlib import Path
import pytest

pytestmark = pytest.mark.skip(reason="Manual integration script; run this module directly instead of pytest.")


def main() -> None:
    """Run the legacy chat service smoke test interactively."""
    backend_dir = Path(__file__).parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    from dotenv import load_dotenv  # Imported lazily to avoid side effects during pytest collection

    env_file = backend_dir / '.env'
    if env_file.exists():
        load_dotenv(env_file)

    import django

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

    from chats.services import ChatService
    from django.contrib.auth.models import User

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

    print("Creating chat session...")
    session_data = ChatService.create_session(
        user=user,
        title='Test Session - Nemotron',
        model='nemotron',
        language='en'
    )
    print(f"✓ Session created: {session_data}")
    print()

    print("Sending test message...")
    try:
        result = ChatService.send_message(
            user=user,
            session_id=session_data['id'],
            message_text='Hello! What is 2+2? Answer in one sentence.',
            model='nemotron'
        )
        print("✓ Message sent successfully!")
        print(f"  User message ID: {result['user_message_id']}")
        print(f"  AI message ID: {result['ai_message_id']}")
        print(f"  Response: {result['response']}")
        print(f"  Model: {result['model']}")
    except Exception as exc:  # pragma: no cover - manual script path
        print(f"✗ Error: {exc}")
        import traceback

        traceback.print_exc()


if __name__ == '__main__':
    main()
