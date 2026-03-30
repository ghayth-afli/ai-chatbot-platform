"""
Tests for AI Model Routing

Validates that messages are routed to correct providers:
- Nemotron → OpenRouter
- LLaMA 3 → Groq
- Trinity → OpenRouter
- Invalid models rejected
"""

import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth.models import User

from .router import dispatch_to_provider, route_to_openrouter, route_to_groq, MODEL_PROVIDER_MAP
from .services import ChatService
from .models import ChatSession, Message


class TestModelRouting(TestCase):
    """Test suite for AI model routing"""

    def setUp(self):
        """Create test user and session"""
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.session = ChatSession.objects.create(
            user=self.user,
            title='Test Session',
            ai_model='Nemotron',
        )

    def test_model_provider_mapping(self):
        """Test that all models are mapped to a provider"""
        # Verify all models have a provider
        self.assertIn('Nemotron', MODEL_PROVIDER_MAP)
        self.assertIn('Liquid', MODEL_PROVIDER_MAP)
        self.assertIn('Trinity', MODEL_PROVIDER_MAP)
        
        # Verify provider values are valid
        self.assertEqual(MODEL_PROVIDER_MAP['Nemotron'], 'openrouter')
        self.assertEqual(MODEL_PROVIDER_MAP['Liquid'], 'groq')
        self.assertEqual(MODEL_PROVIDER_MAP['Trinity'], 'openrouter')

    @pytest.mark.django_db
    def test_dispatch_Nemotron_to_openrouter(self):
        """Test that Nemotron messages go to OpenRouter"""
        with patch('chats.router.route_to_openrouter') as mock_openrouter:
            mock_openrouter.return_value = {'response': 'Test response', 'tokens': 100}
            
            result = dispatch_to_provider('Nemotron', 'Hello', 'system')
            
            # Verify OpenRouter was called
            mock_openrouter.assert_called_once()
            assert result['response'] == 'Test response'

    @pytest.mark.django_db
    def test_dispatch_Liquid_to_groq(self):
        """Test that Liquid messages go to Groq"""
        with patch('chats.router.route_to_groq') as mock_groq:
            mock_groq.return_value = {'response': 'Groq response', 'tokens': 150}
            
            result = dispatch_to_provider('Liquid', 'Hello', 'system')
            
            # Verify Groq was called
            mock_groq.assert_called_once()
            assert result['response'] == 'Groq response'

    @pytest.mark.django_db
    def test_dispatch_Trinity_to_openrouter(self):
        """Test that Trinity messages go to OpenRouter"""
        with patch('chats.router.route_to_openrouter') as mock_openrouter:
            mock_openrouter.return_value = {'response': 'Trinity response', 'tokens': 200}
            
            result = dispatch_to_provider('Trinity', 'Hello', 'system')
            
            # Verify OpenRouter was called
            mock_openrouter.assert_called_once()
            assert result['response'] == 'Trinity response'

    @pytest.mark.django_db
    def test_dispatch_invalid_model(self):
        """Test that invalid models are rejected"""
        result = dispatch_to_provider('invalid_model', 'Hello', 'system')
        
        # Should return error
        assert 'error' in result
        assert 'not supported' in result['error'].lower()

    @pytest.mark.django_db
    def test_dispatch_empty_message(self):
        """Test that empty messages are rejected"""
        result = dispatch_to_provider('Nemotron', '', 'system')
        
        # Should return error
        assert 'error' in result

    @pytest.mark.django_db
    def test_dispatch_oversized_message(self):
        """Test that messages > 5000 chars are rejected"""
        large_message = 'x' * 5001
        result = dispatch_to_provider('Nemotron', large_message, 'system')
        
        # Should return error about length
        assert 'error' in result
        assert 'exceeds' in result['error'].lower()

    @pytest.mark.django_db
    def test_send_message_with_model_Nemotron(self):
        """Test sending message with Nemotron model"""
        with patch('chats.services.dispatch_to_provider') as mock_dispatch:
            mock_dispatch.return_value = {'response': 'AI response', 'tokens': 100}
            
            result = ChatService.send_message(
                self.user,
                self.session.id,
                'What is AI?',
                model='Nemotron'
            )
            
            # Verify dispatch was called with Nemotron
            mock_dispatch.assert_called_once()
            call_args = mock_dispatch.call_args
            assert call_args[0][0] == 'Nemotron'
            assert 'response' in result

    @pytest.mark.django_db
    def test_send_message_with_model_Trinity(self):
        """Test sending message with Trinity model"""
        with patch('chats.services.dispatch_to_provider') as mock_dispatch:
            mock_dispatch.return_value = {'response': 'Trinity response', 'tokens': 150}
            
            result = ChatService.send_message(
                self.user,
                self.session.id,
                'Explain ML',
                model='Trinity'
            )
            
            # Verify dispatch was called with Trinity
            mock_dispatch.assert_called_once()
            call_args = mock_dispatch.call_args
            assert call_args[0][0] == 'Trinity'

    @pytest.mark.django_db
    def test_send_message_with_model_Liquid(self):
        """Test sending message with Liquid model"""
        with patch('chats.services.dispatch_to_provider') as mock_dispatch:
            mock_dispatch.return_value = {'response': 'LLaMA response', 'tokens': 120}
            
            result = ChatService.send_message(
                self.user,
                self.session.id,
                'Tell a joke',
                model='Liquid'
            )
            
            # Verify dispatch was called with Liquid
            mock_dispatch.assert_called_once()
            call_args = mock_dispatch.call_args
            assert call_args[0][0] == 'Liquid'

    @pytest.mark.django_db
    def test_send_message_with_invalid_model(self):
        """Test sending message with invalid model raises error"""
        with self.assertRaises(ValueError):
            ChatService.send_message(
                self.user,
                self.session.id,
                'Hello',
                model='invalid_model'
            )

    @pytest.mark.django_db
    def test_update_session_model_valid(self):
        """Test updating session to valid model"""
        result = ChatService.update_session_model(self.user, self.session.id, 'Liquid')
        
        # Verify model was updated
        assert result['model'] == 'Liquid'
        
        # Verify in database
        session = ChatSession.objects.get(id=self.session.id)
        assert session.ai_model == 'Liquid'

    @pytest.mark.django_db
    def test_update_session_model_all_valid(self):
        """Test updating to each valid model"""
        for model in ['Nemotron', 'Liquid', 'Trinity']:
            result = ChatService.update_session_model(self.user, self.session.id, model)
            assert result['model'] == model
            
            # Verify in database
            session = ChatSession.objects.get(id=self.session.id)
            assert session.ai_model == model

    @pytest.mark.django_db
    def test_update_session_model_invalid(self):
        """Test updating to invalid model raises error"""
        with self.assertRaises(ValueError):
            ChatService.update_session_model(self.user, self.session.id, 'gpt4')
