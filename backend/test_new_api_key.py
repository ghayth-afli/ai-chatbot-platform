#!/usr/bin/env python
"""Test the new OpenRouter API key"""

import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)
api_key = os.getenv('OPENROUTER_API_KEY')

print('🔧 Testing NEW API Key')
print(f'Key: {api_key[:40]}...')
print()

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3000',
    'X-OpenRouter-Title': 'AI Chat Platform'
}

payload = {
    'model': 'nvidia/nemotron-3-super-120b-a12b:free',
    'messages': [{'role': 'user', 'content': 'Hello, test this API key'}],
    'max_tokens': 100
}

print('🚀 Sending request to OpenRouter...')
try:
    r = requests.post('https://openrouter.ai/api/v1/chat/completions', json=payload, headers=headers, timeout=30)
    print(f'Status: {r.status_code}')
    print()
    
    if r.status_code == 200:
        print('✅ SUCCESS! New API key is VALID!')
        data = r.json()
        if 'choices' in data:
            response = data['choices'][0]['message']['content']
            print(f'Response: {response}')
        if 'usage' in data:
            print(f'Tokens used: {data["usage"].get("total_tokens")}')
    else:
        print(f'Error Status: {r.status_code}')
        print(f'Response: {r.text}')
except Exception as e:
    print(f'Error: {e}')
