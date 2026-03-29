"""
Django Channels WebSocket Consumer for real-time chat.

Handles WebSocket connections, authentication, message broadcasting,
and session management for multi-device sync.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from jwt import decode as jwt_decode
import os

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv('SECRET_KEY', 'dev-key-not-for-production-change-me-in-prod-12345')


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for chat operations.
    
    Handles:
    - WebSocket connection/disconnection
    - User authentication via JWT token
    - Message broadcasting to all connected clients in a session
    - Presence tracking
    """

    async def connect(self):
        """
        Accept WebSocket connection after authentication.
        
        - Extract JWT token from query parameters or headers
        - Verify token and get user
        - Join group for session if authorized
        """
        from django.contrib.auth.models import AnonymousUser
        
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.user = self.scope.get('user', AnonymousUser())
        self.room_group_name = f'chat_{self.session_id}'

        # Authenticate user via JWT token
        token = self.get_token_from_scope()
        if not token:
            logger.warning('WebSocket connection attempt without token')
            await self.close()
            return

        try:
            self.user = await self.authenticate_user(token)
            if not self.user:
                logger.warning('Failed to authenticate user from token')
                await self.close()
                return
        except Exception as e:
            logger.error(f'Authentication error: {str(e)}')
            await self.close()
            return

        # Verify user has access to this session
        if not await self.verify_session_access():
            logger.warning(f'User {self.user.id} denied access to session {self.session_id}')
            await self.close()
            return

        # Join the session group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f'User {self.user.id} connected to session {self.session_id}')

        # Notify others that user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',
                'user_id': self.user.id,
                'username': self.user.username,
            }
        )

    async def disconnect(self, close_code):
        """
        Remove user from group on disconnect.
        """
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        logger.info(f'User {self.user.id} disconnected from session {self.session_id}')

        # Notify others that user left
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_leave',
                'user_id': self.user.id,
                'username': self.user.username,
            }
        )

    async def receive(self, text_data=None, bytes_data=None):
        """
        Receive message from WebSocket and broadcast to group.
        """
        if not text_data:
            return

        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            if message_type == 'message':
                await self.handle_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            else:
                logger.warning(f'Unknown message type: {message_type}')
        except json.JSONDecodeError:
            logger.warning('Invalid JSON received')
            await self.send_error('Invalid message format')
        except Exception as e:
            logger.error(f'Error processing message: {str(e)}')
            await self.send_error(f'Error: {str(e)}')

    async def handle_message(self, data):
        """
        Handle incoming chat message and broadcast to group.
        
        Data should contain:
        - content: message text
        - user_id: sender user ID
        """
        content = data.get('content', '').strip()

        if not content:
            await self.send_error('Message cannot be empty')
            return

        if len(content) > 5000:
            await self.send_error('Message too long')
            return

        # Broadcast to all clients in the session
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_message',
                'user_id': self.user.id,
                'username': self.user.username,
                'content': content,
                'timestamp': __import__('datetime').datetime.now().isoformat(),
            }
        )

    async def handle_typing(self, data):
        """
        Handle typing indicator and broadcast to group.
        """
        is_typing = data.get('is_typing', False)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': is_typing,
            }
        )

    # Event handlers for group messages

    async def broadcast_message(self, event):
        """
        Receive message from group and send to WebSocket.
        """
        await self.send(text_data=json.dumps({
            'type': 'message',
            'user_id': event['user_id'],
            'username': event['username'],
            'content': event['content'],
            'timestamp': event['timestamp'],
        }))

    async def typing_indicator(self, event):
        """
        Receive typing indicator from group and send to WebSocket.
        """
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_typing': event['is_typing'],
        }))

    async def user_join(self, event):
        """
        Broadcast user join event to group.
        """
        await self.send(text_data=json.dumps({
            'type': 'user.join',
            'user_id': event['user_id'],
            'username': event['username'],
        }))

    async def user_leave(self, event):
        """
        Broadcast user leave event to group.
        """
        await self.send(text_data=json.dumps({
            'type': 'user.leave',
            'user_id': event['user_id'],
            'username': event['username'],
        }))

    # Helpers

    def get_token_from_scope(self):
        """Extract JWT token from query parameters or headers."""
        # Try query parameter first
        query_string = self.scope.get('query_string', b'').decode()
        if 'token=' in query_string:
            for param in query_string.split('&'):
                if param.startswith('token='):
                    return param.split('=')[1]

        # Try headers
        headers = dict(self.scope.get('headers', []))
        auth_header = headers.get(b'authorization', b'').decode()
        if auth_header.startswith('Bearer '):
            return auth_header[7:]

        return None

    async def authenticate_user(self, token):
        """
        Authenticate user from JWT token.
        
        Returns User instance or None if invalid/expired.
        """
        try:
            payload = jwt_decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload.get('user_id')

            if not user_id:
                return None

            return await self.get_user(user_id)
        except Exception as e:
            logger.warning(f'Token authentication failed: {str(e)}')
            return None

    async def verify_session_access(self):
        """
        Verify user has access to this chat session.
        
        Returns True if user owns the session, False otherwise.
        """
        from chats.models import ChatSession

        try:
            session = await database_sync_to_async(ChatSession.objects.get)(
                id=self.session_id
            )
            return session.user_id == self.user.id
        except ChatSession.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f'Error verifying session access: {str(e)}')
            return False

    @database_sync_to_async
    def get_user(self, user_id):
        """Get user from database."""
        from django.contrib.auth.models import User

        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    async def send_error(self, message):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
        }))
