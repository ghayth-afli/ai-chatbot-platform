from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatSessionViewSet

router = DefaultRouter()
router.register(r'', ChatSessionViewSet, basename='chat-session')

app_name = 'chats'

urlpatterns = [
    path('', include(router.urls)),
]
