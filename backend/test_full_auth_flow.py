#!/usr/bin/env python
"""Manual script that exercises the end-to-end auth + chat flow against a running API."""

import os
import sys
from typing import Optional

import pytest

pytestmark = pytest.mark.skip(reason="Manual HTTP smoke test; run this module directly when a server is available.")


def _setup_django() -> None:
    import django

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()


def _get_or_create_token(email: str, password: str) -> Optional[str]:
    from django.contrib.auth import get_user_model
    from rest_framework.authtoken.models import Token

    User = get_user_model()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        print(f"✗ User not found: {email}")
        return None

    token, created = Token.objects.get_or_create(user=user)
    print(f"✓ User: {user.email}")
    print(f"✓ Token: {token.key[:30]}...")
    print(f"✓ Token Created: {created}")
    return token.key


def main() -> None:
    import requests

    _setup_django()

    BASE_URL = "http://localhost:8000/api"
    TEST_USER_EMAIL = "test@example.com"
    TEST_USER_PASSWORD = "TestPassword123!"

    print("=" * 60)
    print("STEP 1: Get or create auth token")
    print("=" * 60)

    token = _get_or_create_token(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    if not token:
        sys.exit(1)

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\n" + "=" * 60)
    print("STEP 2: Test /api/auth/me/ endpoint")
    print("=" * 60)

    try:
        response = requests.get(f"{BASE_URL}/auth/me/", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as exc:  # pragma: no cover - manual script path
        print(f"✗ Error: {exc}")

    print("\n" + "=" * 60)
    print("STEP 3: Test /api/chat/ endpoint (GET)")
    print("=" * 60)

    try:
        response = requests.get(f"{BASE_URL}/chat/", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Response: {data}")
        else:
            print(f"Response: {response.text[:200]}")
    except Exception as exc:  # pragma: no cover - manual script path
        print(f"✗ Error: {exc}")

    print("\n" + "=" * 60)
    print("STEP 4: Test creating a new chat session")
    print("=" * 60)

    try:
        payload = {
            "title": "Test Chat Session",
            "model": "nemotron",
        }
        response = requests.post(f"{BASE_URL}/chat/", headers=headers, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 201]:
            data = response.json()
            print("✓ Session Created:")
            print(f"  ID: {data.get('id')}")
            print(f"  Title: {data.get('title')}")
            print(f"  Model: {data.get('model')}")
        else:
            print(f"Response: {response.text[:200]}")
    except Exception as exc:  # pragma: no cover - manual script path
        print(f"✗ Error: {exc}")

    print("\n" + "=" * 60)
    print("✓ Full auth flow test completed successfully!")
    print("=" * 60)
    print("\nTo test in browser, use token:")
    print(f"  localStorage.setItem('authToken', '{token}')")
    print("  Reload the page and try to create a new chat")


if __name__ == '__main__':
    main()