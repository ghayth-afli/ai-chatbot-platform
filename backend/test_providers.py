#!/usr/bin/env python
"""Manual connectivity test for AI providers (OpenRouter + Groq)."""

import os
import sys
from pathlib import Path

import pytest

pytestmark = pytest.mark.skip(reason="Manual provider connectivity script; skip during automated tests.")


def _load_env() -> None:
    from dotenv import load_dotenv

    backend_dir = Path(__file__).parent
    env_file = backend_dir / '.env'
    if env_file.exists():
        load_dotenv(env_file)
        print(f"✓ Loaded .env from {env_file}")
    else:
        print(f"✗ .env file not found at {env_file}")
        sys.exit(1)


def _run_provider_checks() -> None:
    import requests

    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    groq_key = os.getenv('GROQ_API_KEY')

    print("\n" + "=" * 60)
    print("API KEY STATUS")
    print("=" * 60)
    print(f"OPENROUTER_API_KEY: {'✓ SET' if openrouter_key else '✗ NOT SET'}")
    if openrouter_key:
        print(f"  └─ Key (first 20 chars): {openrouter_key[:20]}...")
    print(f"GROQ_API_KEY: {'✓ SET' if groq_key else '✗ NOT SET'}")
    if groq_key:
        print(f"  └─ Key (first 20 chars): {groq_key[:20]}...")

    if not openrouter_key or not groq_key:
        print("\n✗ Missing API keys! Cannot proceed with tests.")
        sys.exit(1)

    _test_openrouter(requests, openrouter_key)
    _test_groq(requests, groq_key)
    _test_router_module()


def _test_openrouter(requests, api_key: str) -> None:
    openrouter_url = 'https://openrouter.io/api/v1/chat/completions'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': 'Nemotron/Nemotron-chat',
        'messages': [
            {'role': 'system', 'content': 'You are a helpful AI assistant.'},
            {'role': 'user', 'content': 'Say "OpenRouter API is working!" and nothing else.'}
        ],
        'max_tokens': 100,
        'temperature': 0.7,
    }

    print("\n" + "=" * 60)
    print("TESTING OPENROUTER API")
    print("=" * 60)

    try:
        response = requests.post(openrouter_url, json=payload, headers=headers, timeout=30)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            usage = data.get('usage', {})
            print("✓ SUCCESS")
            print(f"  Response: {content}")
            print(f"  Tokens used: {usage.get('total_tokens', 'N/A')}")
        else:
            print("✗ FAILED")
            print(f"  Response: {response.text}")
    except Exception as exc:  # pragma: no cover - manual script path
        print(f"✗ ERROR: {exc}")


def _test_groq(requests, api_key: str) -> None:
    groq_url = 'https://api.groq.com/openai/v1/chat/completions'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': 'Liquid-70b-8192',
        'messages': [
            {'role': 'system', 'content': 'You are a helpful AI assistant.'},
            {'role': 'user', 'content': 'Say "Groq API is working!" and nothing else.'}
        ],
        'max_tokens': 100,
        'temperature': 0.7,
    }

    print("\n" + "=" * 60)
    print("TESTING GROQ API")
    print("=" * 60)

    try:
        response = requests.post(groq_url, json=payload, headers=headers, timeout=30)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            usage = data.get('usage', {})
            print("✓ SUCCESS")
            print(f"  Response: {content}")
            print(f"  Tokens used: {usage.get('total_tokens', 'N/A')}")
        else:
            print("✗ FAILED")
            print(f"  Response: {response.text}")
    except Exception as exc:  # pragma: no cover - manual script path
        print(f"✗ ERROR: {exc}")


def _test_router_module() -> None:
    from chats.router import dispatch_to_provider

    print("\n" + "=" * 60)
    print("TESTING ROUTER MODULE")
    print("=" * 60)

    for model in ('Nemotron', 'Liquid'):
        print(f"Testing dispatch_to_provider with {model}...")
        result = dispatch_to_provider(model, 'Say "Router test successful!" in one sentence.')
        if 'error' in result:
            print(f"✗ ERROR: {result['error']}")
        else:
            print("✓ SUCCESS")
            print(f"  Response: {result['response']}")
            print(f"  Tokens: {result.get('tokens', 'N/A')}")


def main() -> None:
    _load_env()
    _run_provider_checks()
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    # Ensure backend directory is importable before running manual script
    sys.path.insert(0, str(Path(__file__).parent))
    main()
