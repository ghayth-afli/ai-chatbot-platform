import os
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.urls import get_resolver

resolver = get_resolver()

# Test resolution with just the path segment (without 'api/chat/')
test_paths = [
    'chat/',
    'chat/137/',
    'chat/137/export/',
    'chat/137/send/',
    'chat/137/update_model/',
]

print("=== URL Resolution Tests ===")
for test_url in test_paths:
    try:
        match = resolver.resolve(test_url)
        print(f"  ✓ {test_url} -> Resolved")
    except Exception as e:
        print(f"  ✗ {test_url} -> NOT FOUND: {e}")

# Print all top-level patterns
print("\n=== Config URL Patterns ===")
from config.urls import urlpatterns
for pattern in urlpatterns:
    print(f"  {pattern.pattern}")
