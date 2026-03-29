"""
AI Model Routing Module

Routes messages to OpenRouter API provider
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
    }

# API Endpoints
OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

# Whether to use mock responses (set to False when APIs are available)
USE_MOCK_RESPONSES = False  # ✅ Using real OpenRouter API

# Model mappings to provider
MODEL_PROVIDER_MAP = {
    'nemotron': 'openrouter',
    'liquid': 'openrouter',
    'trinity': 'openrouter',
}

# Model IDs for each provider
OPENROUTER_MODELS = {
    'nemotron': 'nvidia/nemotron-3-super-120b-a12b:free',
    'liquid': 'liquid/lfm-2.5-1.2b-thinking:free',
    'trinity': 'arcee-ai/trinity-mini:free',
}

def get_mock_response(model_id: str, message: str) -> Dict[str, Any]:
    """
    Generate a mock AI response for testing without real API calls.
    """
    mock_responses = {
        'nemotron': f'[Nemotron Mock] Your input: "{message}". Mock response from the Nvidia Nemotron model.',
        'liquid': f'[Liquid Mock] You said: "{message}". Here is a simulated response from the Liquid model.',
        'trinity': f'[Trinity Mock] Message received: "{message}". This is a simulated response from the Trinity model.',
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
        model_id: Model identifier ('nemotron', 'liquid', 'trinity')
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
    
    # Get API key and other config
    openrouter_api_key = openrouter_api_key.strip() if openrouter_api_key else None
    
    headers = {
        'Authorization': f'Bearer {openrouter_api_key}',
        'Content-Type': 'application/json',
        'Referer': os.getenv('FRONTEND_URL', 'http://localhost:3000'),
        'X-OpenRouter-Title': 'AI Chat Platform',
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
        logger.info(f'🔵 OpenRouter Request Details:')
        logger.info(f'  URL: {OPENROUTER_BASE_URL}')
        logger.info(f'  Model: {model_name}')
        logger.info(f'  API Key length: {len(openrouter_api_key) if openrouter_api_key else 0}')
        logger.info(f'  API Key starts with: {openrouter_api_key[:25] if openrouter_api_key else "NONE"}...')
        logger.info(f'  Headers: {list(headers.keys())}')
        logger.info(f'  Message length: {len(message)} chars')
        
        response = requests.post(OPENROUTER_BASE_URL, json=payload, headers=headers, timeout=60)
        
        logger.debug(f'OpenRouter response status: {response.status_code}')
        
        if response.status_code != 200:
            logger.error(f'❌ OpenRouter API Error {response.status_code}')
            logger.error(f'   Response body: {response.text}')
            try:
                error_data = response.json()
                logger.error(f'   Error details: {error_data}')
            except:
                pass
            if response.status_code == 401:
                logger.error('   → 401 Unauthorized: Check API key validity and format')
            elif response.status_code == 405:
                logger.error('   → 405 Method Not Allowed: Check endpoint URL')
            return {'error': f'OpenRouter API error (status {response.status_code}): {response.text[:200]}'}
        
        response.raise_for_status()
        
        logger.info(f'✅ OpenRouter request successful!')
        
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


def dispatch_to_provider(model_id: str, message: str, system_prompt: str = None) -> Dict[str, Any]:
    """
    Dispatcher function that routes message to OpenRouter API.
    
    Args:
        model_id: Model identifier ('nemotron', 'liquid', 'trinity')
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
    
    logger.info(f'Routing {model_id} to OpenRouter provider')
    
    return route_to_openrouter(model_id, message, system_prompt)
