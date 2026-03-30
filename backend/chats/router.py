"""
AI Model Routing Module

Routes messages to OpenRouter API provider
based on selected model and handles API calls.
"""

import math
import os
import time
import logging
import requests
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
DEFAULT_RATE_LIMIT_COOLDOWN = 900  # seconds


class RateLimitGuard:
    """Cache provider rate limit windows to avoid hammering APIs during cooldowns."""

    def __init__(self):
        self._lock = Lock()
        self._state: Dict[str, Any] = {}

    def _purge_if_expired_unlocked(self) -> None:
        if self._state and self._state.get('reset_ts', 0) <= time.time():
            self._state = {}

    def is_limited(self) -> bool:
        with self._lock:
            self._purge_if_expired_unlocked()
            return bool(self._state)

    def get_state(self) -> Dict[str, Any]:
        with self._lock:
            self._purge_if_expired_unlocked()
            return dict(self._state)

    def retry_after_seconds(self) -> int:
        with self._lock:
            self._purge_if_expired_unlocked()
            if not self._state:
                return 0
            remaining = self._state['reset_ts'] - time.time()
            return max(1, int(math.ceil(remaining)))

    def register(self, *, reset_ts: float, limit: Optional[int], remaining: Optional[int]) -> None:
        reset_ts = max(reset_ts, time.time() + 1)
        with self._lock:
            self._state = {
                'reset_ts': reset_ts,
                'limit': limit,
                'remaining': remaining,
                'reset_iso': datetime.fromtimestamp(reset_ts, tz=timezone.utc).isoformat(),
            }

    def clear(self) -> None:
        with self._lock:
            self._state = {}


OPENROUTER_RATE_LIMIT_GUARD = RateLimitGuard()


def reset_openrouter_rate_limit_state() -> None:
    """Reset cached OpenRouter rate limit window (primarily used in tests)."""
    OPENROUTER_RATE_LIMIT_GUARD.clear()


def _safe_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return None


def _parse_reset_timestamp(raw_value: Any) -> Optional[float]:
    if raw_value is None:
        return None
    raw_str = str(raw_value).strip()
    if not raw_str:
        return None
    try:
        value = float(raw_str)
    except ValueError:
        try:
            normalized = raw_str.replace('Z', '+00:00') if raw_str.endswith('Z') else raw_str
            dt = datetime.fromisoformat(normalized)
            return dt.timestamp()
        except ValueError:
            return None
    if value > 1_000_000_000_000:  # milliseconds since epoch
        value /= 1000
    return value


def _extract_rate_limit_info(response, error_body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    headers = getattr(response, 'headers', {}) or {}
    limit = headers.get('X-RateLimit-Limit')
    remaining = headers.get('X-RateLimit-Remaining')
    reset_raw = headers.get('X-RateLimit-Reset')
    retry_after_raw = headers.get('Retry-After')

    metadata_headers = {}
    if error_body:
        metadata = (error_body.get('error') or {}).get('metadata') or {}
        metadata_headers = metadata.get('headers') or {}
        limit = limit or metadata_headers.get('X-RateLimit-Limit')
        remaining = remaining or metadata_headers.get('X-RateLimit-Remaining')
        reset_raw = reset_raw or metadata_headers.get('X-RateLimit-Reset')
        retry_after_raw = retry_after_raw or metadata.get('retry_after')

    return {
        'limit': _safe_int(limit),
        'remaining': _safe_int(remaining),
        'reset_ts': _parse_reset_timestamp(reset_raw),
        'retry_after': _safe_int(retry_after_raw),
    }


def _build_rate_limit_error(message: str, *, retry_after_seconds: int, state_snapshot: Dict[str, Any], source: str) -> Dict[str, Any]:
    state_snapshot = state_snapshot or {}
    retry_after = max(1, retry_after_seconds or DEFAULT_RATE_LIMIT_COOLDOWN)
    return {
        'error': message or 'OpenRouter rate limit exceeded. Please try again later.',
        'error_code': 'provider_rate_limit_error',
        'status_code': 429,
        'rate_limited': True,
        'retry_after_seconds': retry_after,
        'rate_limit_reset_iso': state_snapshot.get('reset_iso'),
        'rate_limit_limit': state_snapshot.get('limit'),
        'rate_limit_remaining': state_snapshot.get('remaining'),
        'rate_limit_source': source,
    }


def _handle_openrouter_rate_limit(response, error_body) -> Dict[str, Any]:
    rate_info = _extract_rate_limit_info(response, error_body)
    reset_ts = rate_info.get('reset_ts')
    fallback_seconds = rate_info.get('retry_after') or DEFAULT_RATE_LIMIT_COOLDOWN
    if reset_ts:
        OPENROUTER_RATE_LIMIT_GUARD.register(
            reset_ts=reset_ts,
            limit=rate_info.get('limit'),
            remaining=rate_info.get('remaining'),
        )
    else:
        OPENROUTER_RATE_LIMIT_GUARD.register(
            reset_ts=time.time() + fallback_seconds,
            limit=rate_info.get('limit'),
            remaining=rate_info.get('remaining'),
        )

    state_snapshot = OPENROUTER_RATE_LIMIT_GUARD.get_state()
    retry_after = OPENROUTER_RATE_LIMIT_GUARD.retry_after_seconds() or fallback_seconds
    provider_message = ((error_body or {}).get('error') or {}).get('message')
    logger.warning(
        'OpenRouter rate limit hit. limit=%s remaining=%s reset=%s',
        state_snapshot.get('limit') or rate_info.get('limit'),
        state_snapshot.get('remaining') or rate_info.get('remaining'),
        state_snapshot.get('reset_iso'),
    )
    return _build_rate_limit_error(
        provider_message or 'OpenRouter rate limit exceeded. Please try again later.',
        retry_after_seconds=retry_after,
        state_snapshot=state_snapshot,
        source='provider',
    )

def _is_test_environment() -> bool:
    """Return True when running under pytest (allows safe fallbacks)."""
    return bool(os.environ.get('PYTEST_CURRENT_TEST'))


def _resolve_api_key(raw_key: Optional[str], fallback_name: str) -> Optional[str]:
    """Normalize provider API keys and allow deterministic fallbacks during tests."""
    if raw_key:
        normalized = raw_key.strip()
        if normalized:
            return normalized
    if _is_test_environment():
        return f'test-{fallback_name.lower()}'
    return None


# Load environment variables on demand
def get_api_keys() -> Dict[str, Optional[str]]:
    """Get API keys for all providers, loading .env if necessary."""
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    env_path = os.path.join(backend_dir, '.env')
    load_dotenv(env_path)
    return {
        'openrouter': os.getenv('OPENROUTER_API_KEY'),
        'groq': os.getenv('GROQ_API_KEY'),
    }

# API Endpoints
OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

# Whether to use mock responses (set to False when APIs are available)
USE_MOCK_RESPONSES = False  # ✅ Using real OpenRouter API


class CaseInsensitiveModelMap(dict):
    """Dictionary that normalizes string keys for case-insensitive lookups."""

    def __init__(self, initial: Dict[str, str]):
        normalized = {self._normalize_key(key): value for key, value in initial.items()}
        super().__init__(normalized)

    @staticmethod
    def _normalize_key(key: str | None) -> str:
        if key is None:
            return ''
        return key.strip().lower()

    def __contains__(self, key: object) -> bool:  # type: ignore[override]
        if not isinstance(key, str):
            return False
        normalized = self._normalize_key(key)
        return bool(normalized) and dict.__contains__(self, normalized)

    def __getitem__(self, key: str) -> str:  # type: ignore[override]
        normalized = self._normalize_key(key)
        if not normalized:
            raise KeyError(key)
        return super().__getitem__(normalized)

    def get(self, key: str | None, default=None):  # type: ignore[override]
        if key is None:
            return default
        normalized = self._normalize_key(key)
        if not normalized:
            return default
        return super().get(normalized, default)

    def normalize_key(self, key: str | None) -> str | None:
        """Return normalized key if present, otherwise None."""
        if key is None:
            return None
        normalized = self._normalize_key(key)
        if normalized and dict.__contains__(self, normalized):
            return normalized
        return None


MODEL_PROVIDER_MAP = CaseInsensitiveModelMap({
    'nemotron': 'openrouter',
    'liquid': 'openrouter',
    'trinity': 'openrouter',
})

MODEL_PROVIDER_ALIASES = {
    'nemotron-chat': 'nemotron',
    'liquid-8b': 'liquid',
}

OPENROUTER_MODEL_ALIASES = {
    'nemotron': 'nemotron',
    'nemotron-chat': 'nemotron',
    'liquid': 'liquid',
    'liquid-8b': 'liquid',
    'trinity': 'trinity',
    'trinity-mini': 'trinity',
}

GROQ_MODEL_ALIASES = {
}

# Model IDs for each provider
OPENROUTER_MODELS = {
    'nemotron': 'nvidia/nemotron-3-super-120b-a12b:free',
    'liquid': 'liquid/lfm-2.5-1.2b-thinking:free',
    'trinity': 'arcee-ai/trinity-mini:free',
}

GROQ_MODELS = {
    'liquid': 'llama-3.2-11b-text-preview',
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

    if OPENROUTER_RATE_LIMIT_GUARD.is_limited():
        retry_after = OPENROUTER_RATE_LIMIT_GUARD.retry_after_seconds()
        state_snapshot = OPENROUTER_RATE_LIMIT_GUARD.get_state()
        logger.warning(
            'Skipping OpenRouter request because provider is still rate limited (%s seconds remaining)',
            retry_after,
        )
        return _build_rate_limit_error(
            'OpenRouter rate limit is still in effect. Please wait before retrying.',
            retry_after_seconds=retry_after or DEFAULT_RATE_LIMIT_COOLDOWN,
            state_snapshot=state_snapshot,
            source='cooldown',
        )
    
    api_keys = get_api_keys()
    openrouter_api_key = _resolve_api_key(api_keys.get('openrouter'), 'OPENROUTER_API_KEY')

    if not openrouter_api_key:
        logger.error('OPENROUTER_API_KEY not set')
        return {'error': 'OpenRouter API key not configured'}

    normalized_model = (model_id or '').strip().lower()
    canonical_model = OPENROUTER_MODEL_ALIASES.get(normalized_model)
    if not canonical_model:
        logger.error('Unknown OpenRouter model: %s', model_id)
        return {'error': f'Unknown model: {model_id}'}

    model_name = OPENROUTER_MODELS[canonical_model]
    requested_model = model_id or canonical_model
    
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
            error_data = None
            try:
                error_data = response.json()
                logger.error(f'   Error details: {error_data}')
            except Exception:  # noqa: BLE001 - logging only
                error_data = None

            if response.status_code == 429:
                return _handle_openrouter_rate_limit(response, error_data)

            if response.status_code == 401:
                logger.error('   → 401 Unauthorized: Check API key validity and format')
            elif response.status_code == 405:
                logger.error('   → 405 Method Not Allowed: Check endpoint URL')

            return {
                'error': f'OpenRouter API error (status {response.status_code}): {response.text[:200]}',
                'status_code': response.status_code,
            }
        
        response.raise_for_status()
        
        logger.info(f'✅ OpenRouter request successful!')
        
        data = response.json()
        content = data['choices'][0]['message']['content']
        usage = data.get('usage', {})
        
        logger.info(f'OpenRouter call successful for model {model_id}')
        return {
            'response': content,
            'tokens': usage.get('total_tokens', 0),
            'model': requested_model,
        }
    except requests.exceptions.RequestException as e:
        status_code = getattr(getattr(e, 'response', None), 'status_code', 503)
        logger.error(f'OpenRouter API error: {str(e)}')
        return {'error': f'API error: {str(e)}', 'status_code': status_code}
    except (KeyError, IndexError) as e:
        logger.error(f'OpenRouter response parsing error: {str(e)}')
        return {'error': f'Failed to parse API response: {str(e)}', 'status_code': 502}
    except Exception as e:
        logger.exception(f'Unexpected error in OpenRouter call: {str(e)}')
        return {'error': f'Unexpected error: {str(e)}', 'status_code': 500}


def route_to_groq(model_id: str, message: str, system_prompt: str = None) -> Dict[str, Any]:
    """Route message to Groq API provider."""
    if USE_MOCK_RESPONSES:
        logger.info(f'Using MOCK response for {model_id} (Groq)')
        return get_mock_response(model_id, message)

    api_keys = get_api_keys()
    groq_api_key = _resolve_api_key(api_keys.get('groq'), 'GROQ_API_KEY')

    if not groq_api_key:
        logger.error('GROQ_API_KEY not set')
        return {'error': 'Groq API key not configured'}

    normalized_model = (model_id or '').strip().lower()
    canonical_model = GROQ_MODEL_ALIASES.get(normalized_model)
    if not canonical_model:
        logger.error('Unknown Groq model: %s', model_id)
        return {'error': f'Unknown model: {model_id}'}

    model_name = GROQ_MODELS[canonical_model]
    requested_model = model_id or canonical_model
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
        logger.info('Routing %s to Groq provider', model_id)
        response = requests.post(GROQ_BASE_URL, json=payload, headers=headers, timeout=60)

        if response.status_code != 200:
            logger.error('Groq API error %s: %s', response.status_code, response.text[:200])
            return {
                'error': f'Groq API error (status {response.status_code}): {response.text[:200]}',
                'status_code': response.status_code,
            }

        data = response.json()
        content = data['choices'][0]['message']['content']
        usage = data.get('usage', {})

        return {
            'response': content,
            'tokens': usage.get('total_tokens', 0),
            'model': requested_model,
        }
    except requests.exceptions.RequestException as exc:
        status_code = getattr(getattr(exc, 'response', None), 'status_code', 503)
        logger.error('Groq API error: %s', exc)
        return {'error': f'API error: {exc}', 'status_code': status_code}
    except (KeyError, IndexError) as exc:
        logger.error('Groq response parsing error: %s', exc)
        return {'error': f'Failed to parse API response: {exc}', 'status_code': 502}
    except Exception as exc:  # pragma: no cover - defensive branch
        logger.exception('Unexpected Groq error: %s', exc)
        return {'error': f'Unexpected error: {exc}', 'status_code': 500}


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
    message = message or ''

    if len(message) > 5000:
        return {'error': 'Message exceeds maximum length of 5000 characters'}
    
    normalized_key = MODEL_PROVIDER_MAP.normalize_key(model_id)
    if not normalized_key:
        alias_key = MODEL_PROVIDER_ALIASES.get((model_id or '').strip().lower())
        if alias_key:
            normalized_key = alias_key
    if not normalized_key:
        logger.error('Unsupported model: %s', model_id)
        return {'error': f'Model {model_id} is not supported'}

    provider = MODEL_PROVIDER_MAP[normalized_key]
    requested_model = model_id or normalized_key

    if provider == 'openrouter':
        logger.info('Routing %s to OpenRouter provider', model_id)
        return route_to_openrouter(requested_model, message, system_prompt)

    if provider == 'groq':
        logger.info('Routing %s to Groq provider', model_id)
        return route_to_groq(requested_model, message, system_prompt)

    logger.error('Provider %s is not implemented for %s', provider, model_id)
    return {'error': f'Provider {provider} not implemented'}
