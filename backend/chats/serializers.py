from rest_framework import serializers
from .models import ChatSession, Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model - for API responses."""

    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'role', 'role_display', 'content', 'ai_model', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for ChatSession model - for API responses."""

    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'ai_model', 'created_at', 'updated_at', 'messages', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        """Return count of messages in this session."""
        return obj.messages.count()


class ChatSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for session list endpoints (no messages)."""

    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'ai_model', 'created_at', 'updated_at', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        """Return count of messages in this session."""
        return obj.messages.count()
