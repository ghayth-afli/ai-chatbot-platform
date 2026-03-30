import os
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from chats.urls import router, urlpatterns
from django.urls import path

print("=== Router URL Patterns ===")
for pattern in router.urls:
    print(f"  {pattern.pattern}")

print("\n=== App urlpatterns ===")
for pattern in urlpatterns:
    print(f"  {pattern.pattern}")

print("\n=== Full URL resolution ===")
from django.urls import get_resolver
resolver = get_resolver()

# Test resolution
test_urls = [
    'api/chat/',
    'api/chat/137/',
    'api/chat/137/export/',
    'api/chat/137/send/',
    'api/chat/137/update_model/',
]

for test_url in test_urls:
    try:
        match = resolver.resolve(test_url)
        print(f"  {test_url} -> {match.func.__name__} (viewset action)")
    except Exception as e:
        print(f"  {test_url} -> NOT FOUND")
