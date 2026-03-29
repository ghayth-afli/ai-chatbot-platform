#!/usr/bin/env python
"""
Test OpenRouter endpoint and request format
"""

import os
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment
backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'
load_dotenv(env_file)

openrouter_key = os.getenv('OPENROUTER_API_KEY')

print("Testing OpenRouter API...")
print(f"API Key: {openrouter_key[:20]}...")

# Try different endpoint URLs
endpoints = [
    'https://openrouter.io/api/v1/chat/completions',
    'https://openrouter.io/api/v1/completions',
]

headers = {
    'Authorization': f'Bearer {openrouter_key}',
    'Content-Type': 'application/json',
}

payload = {
    'model': 'deepseek/deepseek-chat',
    'messages': [
        {'role': 'user', 'content': 'Hello, say "test" in one word'}
    ],
    'max_tokens': 10,
}

for endpoint in endpoints:
    print(f"\nTesting endpoint: {endpoint}")
    try:
        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {str(e)}")

# Also test with curl-like verbose output
print("\n\nTesting with detailed headers...")
import http.client
http.client.HTTPConnection.debuglevel = 1

try:
    response = requests.post(
        'https://openrouter.io/api/v1/chat/completions',
        json=payload,
        headers=headers,
        timeout=10
    )
    print(f"Final Status: {response.status_code}")
    print(f"Full Response: {response.text}")
except Exception as e:
    print(f"Error: {str(e)}")
