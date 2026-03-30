import os
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.urls import get_resolver
import re

resolver = get_resolver()

# Test resolution with the full api/ prefix
test_paths = [
    'api/chat/',
    'api/chat/137/',
    'api/chat/137/export/',
    'api/chat/137/send/',
    'api/chat/137/update_model/',
]

print("=== URL Resolution Tests ===")
for test_url in test_paths:
    try:
        match = resolver.resolve(test_url)
        print(f"  ✓ {test_url}")
        print(f"     -> func: {match.func}")
        print(f"     -> args: {match.args}")
        print(f"     -> kwargs: {match.kwargs}")
    except Exception as e:
        print(f"  ✗ {test_url}")
        print(f"     Error: {e}")

# Directly inspect the API URL configuration
print("\n=== Inspecting API URL Config ===")
from api.urls import urlpatterns as api_patterns
for p in api_patterns:
    print(f"  Pattern: {p.pattern}")
