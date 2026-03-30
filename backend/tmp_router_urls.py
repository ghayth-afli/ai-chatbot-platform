import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.routers import DefaultRouter
from chats.views import ChatSessionViewSet

router = DefaultRouter()
router.register(r'', ChatSessionViewSet, basename='chat')
for url in router.urls:
    print(url)
