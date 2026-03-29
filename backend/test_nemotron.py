#!/usr/bin/env python
"""
Test nvidia/nemotron-3-super-120b-a12b:free model on OpenRouter
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

print("="*60)
print("Testing Nvidia Nemotron Model on OpenRouter")
print("="*60)
print(f"API Key: {openrouter_key[:30]}...")
print()

# Test the Nvidia Nemotron model
url = 'https://openrouter.io/api/v1/chat/completions'
headers = {
    'Authorization': f'Bearer {openrouter_key}',
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3000',
}

payload = {
    'model': 'nvidia/nemotron-3-super-120b-a12b:free',
    'messages': [
        {'role': 'system', 'content': 'You are a helpful AI assistant.'},
        {'role': 'user', 'content': 'Say "Nvidia Nemotron model is working!" and nothing else.'}
    ],
    'max_tokens': 100,
    'temperature': 0.7,
}

print("Sending request to OpenRouter API...")
print(f"Model: nvidia/nemotron-3-super-120b-a12b:free")
print()

try:
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        content = data['choices'][0]['message']['content']
        usage = data.get('usage', {})
        
        print("✓ SUCCESS")
        print(f"Response: {content}")
        print(f"Input tokens: {usage.get('prompt_tokens', 'N/A')}")
        print(f"Output tokens: {usage.get('completion_tokens', 'N/A')}")
        print(f"Total tokens: {usage.get('total_tokens', 'N/A')}")
    else:
        print(f"✗ FAILED")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"✗ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print()
print("="*60)
