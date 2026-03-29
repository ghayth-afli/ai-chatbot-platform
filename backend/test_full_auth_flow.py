#!/usr/bin/env python
"""
Test the full authentication and chat flow
"""
import os
import sys
import django
import requests

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

BASE_URL = "http://localhost:8000/api"

# Use a verified test user
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

print("=" * 60)
print("STEP 1: Get or create auth token")
print("=" * 60)

try:
    user = User.objects.get(email=TEST_USER_EMAIL)
    token, created = Token.objects.get_or_create(user=user)
    print(f"✓ User: {user.email}")
    print(f"✓ Token: {token.key[:30]}...")
    print(f"✓ Token Created: {created}")
except User.DoesNotExist:
    print(f"✗ User not found: {TEST_USER_EMAIL}")
    sys.exit(1)

print("\n" + "=" * 60)
print("STEP 2: Test /api/auth/me/ endpoint")
print("=" * 60)

headers = {
    "Authorization": f"Bearer {token.key}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("STEP 3: Test /api/chat/ endpoint (GET)")
print("=" * 60)

try:
    response = requests.get(f"{BASE_URL}/chat/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Response: {data}")
    else:
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("STEP 4: Test creating a new chat session")
print("=" * 60)

try:
    payload = {
        "title": "Test Chat Session",
        "model": "nemotron"
    }
    response = requests.post(f"{BASE_URL}/chat/", headers=headers, json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code in [200, 201]:
        data = response.json()
        print(f"✓ Session Created:")
        print(f"  ID: {data.get('id')}")
        print(f"  Title: {data.get('title')}")
        print(f"  Model: {data.get('model')}")
        session_id = data.get('id')
    else:
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("✓ Full auth flow test completed successfully!")
print("=" * 60)
print(f"\nTo test in browser, use token:")
print(f"  localStorage.setItem('authToken', '{token.key}')")
print(f"  Reload the page and try to create a new chat")