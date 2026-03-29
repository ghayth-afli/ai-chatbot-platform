"""
AI Model Routing Module

Routes messages to appropriate AI providers (OpenRouter, Groq)
based on selected model and handles API calls.
"""

import os
import logging
import requests
from typing import Dict, Any

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# API Endpoints
OPENROUTER_BASE_URL = 'https://openrouter.io/api/v1/chat/completions'
GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

# Model mappings to provider
MODEL_PROVIDER_MAP = {
    'deepseek': 'openrouter',
    'mistral': 'openrouter',
    'llama3': 'groq',
}

# Model IDs for each provider
OPENROUTER_MODELS = {
    'deepseek': 'deepseek/deepseek-chat',
    'mistral': 'mistral/mistral-7b-instruct',
}

GROQ_MODELS = {
    'llama3': 'llama3-70b-8192',
}


def route_to_openrouter(model_id: str, message: str, system_prompt: str = None) -> Dict[str, Any]:
    """
    Route message to OpenRouter API provider.
    
    Args:
        model_id: Model identifier ('deepseek' or 'mistral')
        message: User message content
        system_prompt: Optional system prompt for context
        
    Returns:
        Dict with 'response' and 'tokens' keys, or error dict
    """
    if not OPENROUTER_API_KEY:
        logger.error('OPENROUTER_API_KEY not set')
        return {'error': 'OpenRouter API key not configured'}
    
    if model_id not in OPENROUTER_MODELS:
        logger.error(f'Unknown OpenRouter model: {model_id}')
        return {'error': f'Unknown model: {model_id}'}
    
    model_name = OPENROUTER_MODELS[model_id]
    
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
        'HTTP-Referer': os.getenv('FRONTEND_URL', 'http://localhost:3000'),
    }
    
    messages = []
    if system_prompt:
        messages.append({'role': 'system', 'content': system_prompt})
    messages.append({'role': 'user', 'content': message})
    
    payload = {
        'model': model_name,
        'messages': messages,
        'max_tokens': 2000,
        'temperature': 0.7,
    }
    
    try:
        response = requests.post(OPENROUTER_BASE_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        content = data['choices'][0]['message']['content']
        usage = data.get('usage', {})
        
        logger.info(f'OpenRouter call successful for model {model_id}')
        return {
            'response': content,
            'tokens': usage.get('total_tokens', 0),
            'model': model_id,
        }
    except requests.exceptions.RequestException as e:
        logger.error(f'OpenRouter API error: {str(e)}')
        return {'error': f'API error: {str(e)}'}


def route_to_groq(model_id: str, message: str, system_prompt: str = None) -> Dict[str, Any]:
    """
    Route message to Groq API provider.
    
    Args:
        model_id: Model identifier ('llama3')
        message: User message content
        system_prompt: Optional system prompt for context
        
    Returns:
        Dict with 'response' and 'tokens' keys, or error dict
    """
    if not GROQ_API_KEY:
        logger.error('GROQ_API_KEY not set')
        return {'error': 'Groq API key not configured'}
    
    if model_id not in GROQ_MODELS:
        logger.error(f'Unknown Groq model: {model_id}')
        return {'error': f'Unknown model: {model_id}'}
    
    model_name = GROQ_MODELS[model_id]
    
    headers = {
        'Authorization': f'Bearer {GROQ_API_KEY}',
        'Content-Type': 'application/json',
    }
    
    messages = []
    if system_prompt:
        messages.append({'role': 'system', 'content': system_prompt})
    messages.append({'role': 'user', 'content': message})
    
    payload = {
        'model': model_name,
        'messages': messages,
        'max_tokens': 2000,
        'temperature': 0.7,
    }
    
    try:
        response = requests.post(GROQ_BASE_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        content = data['choices'][0]['message']['content']
        usage = data.get('usage', {})
        
        logger.info(f'Groq call successful for model {model_id}')
        return {
            'response': content,
            'tokens': usage.get('total_tokens', 0),
            'model': model_id,
        }
    except requests.exceptions.RequestException as e:
        logger.error(f'Groq API error: {str(e)}')
        return {'error': f'API error: {str(e)}'}


def dispatch_to_provider(model_id: str, message: str, system_prompt: str = None) -> Dict[str, Any]:
    """
    Dispatcher function that routes message to correct provider based on model.
    
    Args:
        model_id: Model identifier ('deepseek', 'mistral', 'llama3')
        message: User message content
        system_prompt: Optional system prompt for context
        
    Returns:
        Dict with 'response' key containing AI response, or error dict
    """
    if not message or not message.strip():
        return {'error': 'Message cannot be empty'}
    
    if message and len(message) > 5000:
        return {'error': 'Message exceeds maximum length of 5000 characters'}
    
    # Validate model is supported
    if model_id not in MODEL_PROVIDER_MAP:
        logger.error(f'Unsupported model: {model_id}')
        return {'error': f'Model {model_id} is not supported'}
    
    provider = MODEL_PROVIDER_MAP[model_id]
    
    logger.info(f'Routing {model_id} to {provider} provider')
    
    if provider == 'openrouter':
        return route_to_openrouter(model_id, message, system_prompt)
    elif provider == 'groq':
        return route_to_groq(model_id, message, system_prompt)
    else:
        logger.error(f'Unknown provider: {provider}')
        return {'error': f'Unknown provider: {provider}'}
