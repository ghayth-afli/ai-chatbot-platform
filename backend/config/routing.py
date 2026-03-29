"""
WebSocket URL routing configuration for Django Channels.

Maps WebSocket connections to appropriate consumers based on URL pattern.
"""

from django.urls import re_path
from chats.consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<session_id>\w+)/$', ChatConsumer.as_asgi()),
]
