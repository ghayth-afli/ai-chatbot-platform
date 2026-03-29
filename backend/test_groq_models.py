#!/usr/bin/env python
"""
Test Groq available models
"""

import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment
backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'
load_dotenv(env_file)

groq_key = os.getenv('GROQ_API_KEY')

# List of Groq models to try
models_to_try = [
    'mixtral-8x7b-32768',
    'llama-3.1-70b-versatile',
    'llama-3-70b-8192',
    'llama-3-8b-instant',
    'gemma2-9b-it',
]

groq_url = 'https://api.groq.com/openai/v1/chat/completions'
groq_headers = {
    'Authorization': f'Bearer {groq_key}',
    'Content-Type': 'application/json',
}

for model in models_to_try:
    payload = {
        'model': model,
        'messages': [
            {'role': 'user', 'content': 'Hello'}
        ],
        'max_tokens': 10,
    }
    
    try:
        print(f"Testing model: {model}...", end=" ")
        response = requests.post(groq_url, json=payload, headers=groq_headers, timeout=10)
        if response.status_code == 200:
            print("✓ OK")
        else:
            error_msg = response.json().get('error', {}).get('message', 'Unknown error')
            print(f"✗ {response.status_code} - {error_msg[:50]}")
    except Exception as e:
        print(f"✗ ERROR: {str(e)[:50]}")
