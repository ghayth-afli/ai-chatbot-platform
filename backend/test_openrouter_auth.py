#!/usr/bin/env python
"""
Test OpenRouter authentication and models
"""

import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment
backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'
load_dotenv(env_file)

openrouter_key = os.getenv('OPENROUTER_API_KEY')

print(f"OpenRouter API Key: {openrouter_key[:30]}...")
print(f"Full key length: {len(openrouter_key)}")
print()

# Test 1: Get models list
print("Test 1: Getting models list...")
headers = {
    'Authorization': f'Bearer {openrouter_key}',
}

try:
    response = requests.get('https://openrouter.io/api/v1/models', headers=headers, timeout=10)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Got models list with {len(data.get('data', []))} models")
        # Print first few models
        for model in data.get('data', [])[:5]:
            print(f"  - {model.get('id')}")
    else:
        print(f"✗ Error: {response.text[:200]}")
except Exception as e:
    print(f"✗ Exception: {str(e)}")

# Test 2: Try chat completion with different headers
print("\nTest 2: Chat completion with referer header...")
headers = {
    'Authorization': f'Bearer {openrouter_key}',
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'AI Chat Platform',
}

payload = {
    'model': 'deepseek/deepseek-chat',
    'messages': [{'role': 'user', 'content': 'test'}],
    'max_tokens': 10,
}

try:
    response = requests.post(
        'https://openrouter.io/api/v1/chat/completions',
        json=payload,
        headers=headers,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"✓ Success!")
        data = response.json()
        print(f"Response: {data['choices'][0]['message']['content']}")
    else:
        print(f"✗ Error: {response.text[:200]}")
except Exception as e:
    print(f"✗ Exception: {str(e)}")

# Test 3: List available models from OpenRouter
print("\nTest 3: Checking if DeepSeek model exists...")
try:
    response = requests.get('https://openrouter.io/api/v1/models', headers=headers, timeout=10)
    if response.status_code == 200:
        data = response.json()
        deepseek_models = [m for m in data.get('data', []) if 'deepseek' in m.get('id', '').lower()]
        print(f"Found {len(deepseek_models)} DeepSeek models:")
        for model in deepseek_models:
            print(f"  - {model.get('id')}")
except Exception as e:
    print(f"✗ Exception: {str(e)}")
