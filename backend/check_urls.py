import os
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.urls import get_resolver

resolver = get_resolver()
print("=== All URL patterns containing 'chat' or 'export' ===")
for pattern in resolver.url_patterns:
    pattern_str = str(pattern.pattern)
    if 'chat' in pattern_str.lower() or 'export' in pattern_str.lower():
        print(f"  {pattern_str}")

print("\n=== Checking chat app router patterns ===")
from chats.urls import router
for route in router.registry:
    print(f"  Prefix: {route[0]}, ViewSet: {route[1].__class__.__name__}")
    
print("\n=== Actions in ChatSessionViewSet ===")
from chats.views import ChatSessionViewSet
for attr_name in dir(ChatSessionViewSet):
    attr = getattr(ChatSessionViewSet, attr_name)
    if hasattr(attr, 'mapping'):
        print(f"  {attr_name}: {attr.mapping}")
