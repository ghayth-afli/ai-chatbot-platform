import os
import sys
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.test import Client
from django.urls import reverse

client = Client()

# Try to access the export endpoint
print("=== Testing Export Endpoint ===")
from django.contrib.auth import get_user_model
User = get_user_model()

try:
    # Create test user if needed
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    client.force_login(user)
    
    # Try a GET to the export endpoint for a non-existent session
    # This should give us info about the routing
    response = client.get('/api/chat/137/export/?format=pdf&language=en')
    print(f"Response Status: {response.status_code}")
    print(f"Response Content: {response.content[:200]}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

# Also check if the endpoint is registered
print("\n=== Checking Route Registration ===")
from django.urls import get_resolver
resolver = get_resolver()
patterns = resolver.url_patterns

def print_patterns(patterns, prefix=''):
    for pattern in patterns:
        full_pattern = prefix + str(pattern.pattern)
        if 'chat' in full_pattern.lower():
            print(f"  {full_pattern}")
        if hasattr(pattern, 'url_patterns'):
            print_patterns(pattern.url_patterns, full_pattern)

print_patterns(patterns)
