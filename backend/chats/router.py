"""
AI Model Routing Module

Routes messages to appropriate AI providers (OpenRouter, Groq)
based on selected model and handles API calls.
"""

import os
import logging
import requests
from typing import Dict, Any
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables on demand
def get_api_keys():
    """Get API keys, loading .env if necessary"""
    # Explicitly load .env from backend directory
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    env_path = os.path.join(backend_dir, '.env')
    load_dotenv(env_path)
    return {
        'openrouter': os.getenv('OPENROUTER_API_KEY'),
        'groq': os.getenv('GROQ_API_KEY'),
        'mock': True,  # Enable mock responses for testing
    }

# API Endpoints
OPENROUTER_BASE_URL = 'https://openrouter.io/api/v1/chat/completions'
GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

# Whether to use mock responses (set to False when APIs are available)
USE_MOCK_RESPONSES = False

# Model mappings to provider
MODEL_PROVIDER_MAP = {
    'deepseek': 'openrouter',
    'mistral': 'openrouter',
    'nemotron': 'openrouter',
    'llama3': 'groq',
}

# Model IDs for each provider
OPENROUTER_MODELS = {
    'deepseek': 'deepseek/deepseek-chat',
    'mistral': 'mistral/mistral-7b-instruct',
    'nemotron': 'nvidia/nemotron-3-super-120b-a12b:free',
}

GROQ_MODELS = {
    'llama3': 'llama3-70b-8192',
}


def get_mock_response(model_id: str, message: str) -> Dict[str, Any]:
    """
    Generate a mock AI response for testing without real API calls.
    """
    mock_responses = {
        'deepseek': f'[DeepSeek Mock] I received your message: "{message}". This is a test response from the mock DeepSeek model.',
        'mistral': f'[Mistral Mock] You said: "{message}". Here is a simulated response from the Mistral model.',
        'nemotron': f'[Nemotron Mock] Your input: "{message}". Mock response from the Nvidia Nemotron model.',
        'llama3': f'[LLaMA3 Mock] Message received: "{message}". This is a simulated response from the LLaMA3 model via Groq.',
    }
    
    response_text = mock_responses.get(model_id, f'[Mock] Received: "{message}"')
    
    return {
        'response': response_text,
        'tokens': 150,
        'model': model_id,
    }


def route_to_openrouter(model_id: str, message: str, system_prompt: str = None) -> Dict[str, Any]:
    """
    Route message to OpenRouter API provider.
    
    Args:
        model_id: Model identifier ('deepseek', 'mistral', 'nemotron')
        message: User message content
        system_prompt: Optional system prompt for context
        
    Returns:
        Dict with 'response' and 'tokens' keys, or error dict
    """
    # Use mock response for testing if real API is unavailable
    if USE_MOCK_RESPONSES:
        logger.info(f'Using MOCK response for {model_id} (set USE_MOCK_RESPONSES=False to use real API)')
        return get_mock_response(model_id, message)
    
    api_keys = get_api_keys()
    openrouter_api_key = api_keys['openrouter']
    
    if not openrouter_api_key:
        logger.error('OPENROUTER_API_KEY not set')
        return {'error': 'OpenRouter API key not configured'}
    
    if model_id not in OPENROUTER_MODELS:
        logger.error(f'Unknown OpenRouter model: {model_id}')
        return {'error': f'Unknown model: {model_id}'}
    
    model_name = OPENROUTER_MODELS[model_id]
    
    headers = {
        'Authorization': f'Bearer {openrouter_api_key}',
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
        logger.debug(f'OpenRouter request: URL={OPENROUTER_BASE_URL}, model={model_name}')
        logger.debug(f'API key (first 30 chars): {openrouter_api_key[:30]}...')
        
        response = requests.post(OPENROUTER_BASE_URL, json=payload, headers=headers, timeout=60)
        
        logger.debug(f'OpenRouter response status: {response.status_code}')
        
        if response.status_code != 200:
            logger.error(f'OpenRouter API returned {response.status_code}: {response.text[:200]}')
            if response.status_code == 405:
                logger.error('405 Method Not Allowed - This may indicate an authentication issue or endpoint problem')
            return {'error': f'OpenRouter API error (status {response.status_code}): {response.text[:100]}'}
        
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
    except (KeyError, IndexError) as e:
        logger.error(f'OpenRouter response parsing error: {str(e)}')
        return {'error': f'Failed to parse API response: {str(e)}'}
    except Exception as e:
        logger.exception(f'Unexpected error in OpenRouter call: {str(e)}')
        return {'error': f'Unexpected error: {str(e)}'}


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
    # Use mock response for testing if real API is unavailable
    if USE_MOCK_RESPONSES:
        logger.info(f'Using MOCK response for {model_id} (set USE_MOCK_RESPONSES=False to use real API)')
        return get_mock_response(model_id, message)
    
    api_keys = get_api_keys()
    groq_api_key = api_keys['groq']
    
    if not groq_api_key:
        logger.error('GROQ_API_KEY not set')
        return {'error': 'Groq API key not configured'}
    
    if model_id not in GROQ_MODELS:
        logger.error(f'Unknown Groq model: {model_id}')
        return {'error': f'Unknown model: {model_id}'}
    
    model_name = GROQ_MODELS[model_id]
    
    headers = {
        'Authorization': f'Bearer {groq_api_key}',
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
