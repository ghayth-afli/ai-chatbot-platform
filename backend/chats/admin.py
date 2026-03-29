from django.contrib import admin
from .models import ChatSession, Message


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'ai_model', 'created_at', 'updated_at']
    list_filter = ['ai_model', 'created_at', 'updated_at']
    search_fields = ['user__username', 'title']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'ai_model', 'created_at', 'content_preview']
    list_filter = ['role', 'ai_model', 'created_at']
    search_fields = ['session__title', 'content']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

    def content_preview(self, obj):
        """Show first 100 characters of content."""
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content Preview'
