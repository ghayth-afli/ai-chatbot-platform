"""
Test OpenRouter API Key and Models
"""
import os
import sys
import django
from dotenv import load_dotenv

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Load .env before Django setup
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'))

django.setup()

import requests

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Test models
test_models = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "liquid/lfm-2.5-1.2b-thinking:free",
    "arcee-ai/trinity-mini:free"
]

print("=" * 70)
print("TESTING OPENROUTER API KEY")
print("=" * 70)

print(f"\nAPI Key: {OPENROUTER_API_KEY[:20]}...{OPENROUTER_API_KEY[-10:]}")
print(f"Endpoint: {OPENROUTER_URL}")

if not OPENROUTER_API_KEY:
    print("\n✗ ERROR: OPENROUTER_API_KEY not found in .env!")
    sys.exit(1)

print("\n" + "=" * 70)
print("TESTING MODELS")
print("=" * 70)

for model in test_models:
    print(f"\n{'─' * 70}")
    print(f"Testing: {model}")
    print('─' * 70)
    
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Nexus AI Chat Platform"
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": "Say 'Hello from OpenRouter!' in exactly those words."
                }
            ],
            "temperature": 0.7,
            "max_tokens": 50
        }
        
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            message = data['choices'][0]['message']['content']
            print(f"✓ Model Response: {message[:100]}")
            print(f"✓ Tokens Used: {data.get('usage', {})}")
        else:
            print(f"✗ Error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"✗ Exception: {str(e)}")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
