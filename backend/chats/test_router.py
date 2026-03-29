"""
Tests for chat router - AI provider routing logic
"""

import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from chats.router import (
    route_to_openrouter,
    route_to_groq,
    dispatch_to_provider,
    MODEL_PROVIDER_MAP,
    OPENROUTER_BASE_URL,
    GROQ_BASE_URL,
)


class TestRouteToOpenRouter(TestCase):
    """Test OpenRouter provider routing"""

    @patch('chats.router.requests.post')
    def test_route_to_openrouter_success(self, mock_post):
        """Test successful OpenRouter API call"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [{'message': {'content': 'Test response'}}],
            'usage': {'total_tokens': 50},
        }
        mock_post.return_value = mock_response

        result = route_to_openrouter(
            'deepseek-chat',
            'Hello',
            'You are helpful',
        )

        assert result['response'] == 'Test response'
        assert result['tokens'] == 50
        assert result['model'] == 'deepseek-chat'
        mock_post.assert_called_once()

    @patch('chats.router.requests.post')
    def test_route_to_openrouter_error(self, mock_post):
        """Test OpenRouter API error handling"""
        mock_post.side_effect = Exception('Connection error')

        result = route_to_openrouter(
            'deepseek-chat',
            'Hello',
            'You are helpful',
        )

        assert result['error'] is not None
        assert 'Connection error' in result['error']

    @patch('chats.router.requests.post')
    def test_route_to_openrouter_invalid_response(self, mock_post):
        """Test handling of invalid OpenRouter response"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = 'Invalid request'
        mock_post.return_value = mock_response

        result = route_to_openrouter(
            'deepseek-chat',
            'Hello',
            'You are helpful',
        )

        assert result['error'] is not None


class TestRouteToGroq(TestCase):
    """Test Groq provider routing"""

    @patch('chats.router.requests.post')
    def test_route_to_groq_success(self, mock_post):
        """Test successful Groq API call"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [{'message': {'content': 'Groq response'}}],
            'usage': {'total_tokens': 30},
        }
        mock_post.return_value = mock_response

        result = route_to_groq(
            'llama3-8b',
            'Hello',
            'Be concise',
        )

        assert result['response'] == 'Groq response'
        assert result['tokens'] == 30
        assert result['model'] == 'llama3-8b'

    @patch('chats.router.requests.post')
    def test_route_to_groq_rate_limit(self, mock_post):
        """Test Groq rate limiting"""
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = 'Rate limited'
        mock_post.return_value = mock_response

        result = route_to_groq(
            'llama3-8b',
            'Hello',
            'Be concise',
        )

        assert result['error'] is not None


class TestDispatchToProvider(TestCase):
    """Test main dispatch logic"""

    def test_model_provider_map_coverage(self):
        """Verify all supported models are in provider map"""
        supported_models = ['deepseek', 'mistral', 'llama3']
        for model in supported_models:
            assert model in MODEL_PROVIDER_MAP

    @patch('chats.router.route_to_openrouter')
    def test_dispatch_deepseek(self, mock_route):
        """Test dispatch routes deepseek to OpenRouter"""
        mock_route.return_value = {
            'response': 'test',
            'tokens': 20,
            'model': 'deepseek-chat',
        }

        result = dispatch_to_provider(
            'deepseek',
            'Hello',
            'You are helpful',
        )

        assert result['model'] == 'deepseek-chat'
        mock_route.assert_called_once()

    @patch('chats.router.route_to_openrouter')
    def test_dispatch_mistral(self, mock_route):
        """Test dispatch routes mistral to OpenRouter"""
        mock_route.return_value = {
            'response': 'test',
            'tokens': 20,
            'model': 'mistral-small',
        }

        result = dispatch_to_provider(
            'mistral',
            'Hello',
            'Be helpful',
        )

        assert result['model'] == 'mistral-small'
        mock_route.assert_called_once()

    @patch('chats.router.route_to_groq')
    def test_dispatch_llama3(self, mock_route):
        """Test dispatch routes llama3 to Groq"""
        mock_route.return_value = {
            'response': 'test',
            'tokens': 20,
            'model': 'llama3-8b',
        }

        result = dispatch_to_provider(
            'llama3',
            'Hello',
            'Be concise',
        )

        assert result['model'] == 'llama3-8b'
        mock_route.assert_called_once()

    def test_dispatch_unsupported_model(self):
        """Test dispatch with unsupported model"""
        result = dispatch_to_provider(
            'gpt-5',  # Not supported
            'Hello',
            'You are helpful',
        )

        assert result['error'] is not None
        assert 'not supported' in result['error'].lower()

    @patch('chats.router.route_to_openrouter')
    def test_dispatch_with_empty_message(self, mock_route):
        """Test dispatch with empty message"""
        mock_route.return_value = {
            'response': '',
            'tokens': 0,
            'model': 'deepseek-chat',
        }

        result = dispatch_to_provider(
            'deepseek',
            '',
            'You are helpful',
        )

        assert result['response'] == ''
        mock_route.assert_called_once()
