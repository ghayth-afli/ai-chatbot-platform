from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatSessionViewSet, ChatHistoryListView

router = DefaultRouter()
router.register(r'', ChatSessionViewSet, basename='chat')

session_detail_view = ChatSessionViewSet.as_view({'get': 'retrieve'})

app_name = 'chats'

urlpatterns = [
    path('history/', ChatHistoryListView.as_view(), name='chat-history'),
    path('session/<int:pk>/', session_detail_view, name='chat-session-detail'),
    path('', include(router.urls)),
]
