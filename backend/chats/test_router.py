"""
Tests for chat router - AI provider routing logic
"""

import time
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
    reset_openrouter_rate_limit_state,
)


class TestRouteToOpenRouter(TestCase):
    """Test OpenRouter provider routing"""

    def setUp(self):
        reset_openrouter_rate_limit_state()

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
            'Nemotron-chat',
            'Hello',
            'You are helpful',
        )

        assert result['response'] == 'Test response'
        assert result['tokens'] == 50
        assert result['model'] == 'Nemotron-chat'
        mock_post.assert_called_once()

    @patch('chats.router.requests.post')
    def test_route_to_openrouter_error(self, mock_post):
        """Test OpenRouter API error handling"""
        mock_post.side_effect = Exception('Connection error')

        result = route_to_openrouter(
            'Nemotron-chat',
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
            'Nemotron-chat',
            'Hello',
            'You are helpful',
        )

        assert result['error'] is not None

    @patch('chats.router.requests.post')
    def test_route_to_openrouter_rate_limit_response(self, mock_post):
        """Test OpenRouter provider rate limit handling."""
        reset_time = int(time.time()) + 60
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = 'Rate limited'
        mock_response.headers = {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': str(reset_time),
        }
        mock_response.json.return_value = {
            'error': {
                'message': 'Rate limit exceeded',
                'metadata': {
                    'headers': {
                        'X-RateLimit-Limit': '50',
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': str(reset_time),
                    },
                },
            },
        }
        mock_post.return_value = mock_response

        result = route_to_openrouter('Nemotron-chat', 'Hello', 'You are helpful')

        assert result['error_code'] == 'provider_rate_limit_error'
        assert result['status_code'] == 429
        assert result['retry_after_seconds'] >= 1
        assert result['rate_limit_reset_iso'] is not None

    @patch('chats.router.requests.post')
    def test_route_to_openrouter_skips_during_cooldown(self, mock_post):
        """Subsequent requests should short-circuit while rate limited."""
        reset_time = int(time.time()) + 120
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = 'Rate limited'
        mock_response.headers = {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': str(reset_time),
        }
        mock_response.json.return_value = {
            'error': {
                'message': 'Rate limit exceeded',
                'metadata': {
                    'headers': {
                        'X-RateLimit-Limit': '50',
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': str(reset_time),
                    },
                },
            },
        }
        mock_post.return_value = mock_response

        first_result = route_to_openrouter('Nemotron-chat', 'Hello', 'You are helpful')
        assert first_result['error_code'] == 'provider_rate_limit_error'
        mock_post.assert_called_once()

        second_result = route_to_openrouter('Nemotron-chat', 'Hello again', 'You are helpful')
        assert second_result['error_code'] == 'provider_rate_limit_error'
        assert second_result['rate_limit_source'] == 'cooldown'
        mock_post.assert_called_once()


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
            'Liquid-8b',
            'Hello',
            'Be concise',
        )

        assert result['response'] == 'Groq response'
        assert result['tokens'] == 30
        assert result['model'] == 'Liquid-8b'

    @patch('chats.router.requests.post')
    def test_route_to_groq_rate_limit(self, mock_post):
        """Test Groq rate limiting"""
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = 'Rate limited'
        mock_post.return_value = mock_response

        result = route_to_groq(
            'Liquid-8b',
            'Hello',
            'Be concise',
        )

        assert result['error'] is not None


class TestDispatchToProvider(TestCase):
    """Test main dispatch logic"""

    def test_model_provider_map_coverage(self):
        """Verify all supported models are in provider map"""
        supported_models = ['Nemotron', 'Trinity', 'Liquid']
        for model in supported_models:
            assert model in MODEL_PROVIDER_MAP

    @patch('chats.router.route_to_openrouter')
    def test_dispatch_Nemotron(self, mock_route):
        """Test dispatch routes Nemotron to OpenRouter"""
        mock_route.return_value = {
            'response': 'test',
            'tokens': 20,
            'model': 'Nemotron-chat',
        }

        result = dispatch_to_provider(
            'Nemotron',
            'Hello',
            'You are helpful',
        )

        assert result['model'] == 'Nemotron-chat'
        mock_route.assert_called_once()

    @patch('chats.router.route_to_openrouter')
    def test_dispatch_Trinity(self, mock_route):
        """Test dispatch routes Trinity to OpenRouter"""
        mock_route.return_value = {
            'response': 'test',
            'tokens': 20,
            'model': 'Trinity-small',
        }

        result = dispatch_to_provider(
            'Trinity',
            'Hello',
            'Be helpful',
        )

        assert result['model'] == 'Trinity-small'
        mock_route.assert_called_once()

    @patch('chats.router.route_to_groq')
    def test_dispatch_Liquid(self, mock_route):
        """Test dispatch routes Liquid to Groq"""
        mock_route.return_value = {
            'response': 'test',
            'tokens': 20,
            'model': 'Liquid-8b',
        }

        result = dispatch_to_provider(
            'Liquid',
            'Hello',
            'Be concise',
        )

        assert result['model'] == 'Liquid-8b'
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
            'model': 'Nemotron-chat',
        }

        result = dispatch_to_provider(
            'Nemotron',
            '',
            'You are helpful',
        )

        assert result['response'] == ''
        mock_route.assert_called_once()
