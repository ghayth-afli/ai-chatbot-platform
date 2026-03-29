#!/usr/bin/env python
"""
Test script to verify AI provider connectivity and API keys.
Tests both OpenRouter and Groq providers.
"""

import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment
backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'
if env_file.exists():
    load_dotenv(env_file)
    print(f"✓ Loaded .env from {env_file}")
else:
    print(f"✗ .env file not found at {env_file}")
    sys.exit(1)

# Get API keys
openrouter_key = os.getenv('OPENROUTER_API_KEY')
groq_key = os.getenv('GROQ_API_KEY')

print("\n" + "="*60)
print("API KEY STATUS")
print("="*60)
print(f"OPENROUTER_API_KEY: {'✓ SET' if openrouter_key else '✗ NOT SET'}")
if openrouter_key:
    print(f"  └─ Key (first 20 chars): {openrouter_key[:20]}...")
print(f"GROQ_API_KEY: {'✓ SET' if groq_key else '✗ NOT SET'}")
if groq_key:
    print(f"  └─ Key (first 20 chars): {groq_key[:20]}...")

if not openrouter_key or not groq_key:
    print("\n✗ Missing API keys! Cannot proceed with tests.")
    sys.exit(1)

print("\n" + "="*60)
print("TESTING OPENROUTER API")
print("="*60)

# Test OpenRouter
openrouter_url = 'https://openrouter.io/api/v1/chat/completions'
openrouter_headers = {
    'Authorization': f'Bearer {openrouter_key}',
    'Content-Type': 'application/json',
}

payload = {
    'model': 'deepseek/deepseek-chat',
    'messages': [
        {'role': 'system', 'content': 'You are a helpful AI assistant.'},
        {'role': 'user', 'content': 'Say "OpenRouter API is working!" and nothing else.'}
    ],
    'max_tokens': 100,
    'temperature': 0.7,
}

try:
    print(f"URL: {openrouter_url}")
    print(f"Model: deepseek/deepseek-chat")
    print("Sending request...")
    response = requests.post(openrouter_url, json=payload, headers=openrouter_headers, timeout=30)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        content = data['choices'][0]['message']['content']
        usage = data.get('usage', {})
        print(f"✓ SUCCESS")
        print(f"  Response: {content}")
        print(f"  Tokens used: {usage.get('total_tokens', 'N/A')}")
    else:
        print(f"✗ FAILED")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ ERROR: {str(e)}")

print("\n" + "="*60)
print("TESTING GROQ API")
print("="*60)

# Test Groq
groq_url = 'https://api.groq.com/openai/v1/chat/completions'
groq_headers = {
    'Authorization': f'Bearer {groq_key}',
    'Content-Type': 'application/json',
}

payload = {
    'model': 'llama3-70b-8192',
    'messages': [
        {'role': 'system', 'content': 'You are a helpful AI assistant.'},
        {'role': 'user', 'content': 'Say "Groq API is working!" and nothing else.'}
    ],
    'max_tokens': 100,
    'temperature': 0.7,
}

try:
    print(f"URL: {groq_url}")
    print(f"Model: llama3-70b-8192")
    print("Sending request...")
    response = requests.post(groq_url, json=payload, headers=groq_headers, timeout=30)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        content = data['choices'][0]['message']['content']
        usage = data.get('usage', {})
        print(f"✓ SUCCESS")
        print(f"  Response: {content}")
        print(f"  Tokens used: {usage.get('total_tokens', 'N/A')}")
    else:
        print(f"✗ FAILED")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ ERROR: {str(e)}")

print("\n" + "="*60)
print("TESTING ROUTER MODULE")
print("="*60)

try:
    from chats.router import dispatch_to_provider
    
    print("Testing dispatch_to_provider with DeepSeek...")
    result = dispatch_to_provider('deepseek', 'Say "Router test successful!" in one sentence.')
    
    if 'error' in result:
        print(f"✗ ERROR: {result['error']}")
    else:
        print(f"✓ SUCCESS")
        print(f"  Response: {result['response']}")
        print(f"  Tokens: {result.get('tokens', 'N/A')}")
    
    print("\nTesting dispatch_to_provider with LLaMA3...")
    result = dispatch_to_provider('llama3', 'Say "Router test successful!" in one sentence.')
    
    if 'error' in result:
        print(f"✗ ERROR: {result['error']}")
    else:
        print(f"✓ SUCCESS")
        print(f"  Response: {result['response']}")
        print(f"  Tokens: {result.get('tokens', 'N/A')}")
        
except Exception as e:
    print(f"✗ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60)
