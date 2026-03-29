"""
Quick test of OpenRouter API Key
"""
import os
import sys
import requests
from dotenv import load_dotenv

# Load .env
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'))

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

print("=" * 70)
print("OPENROUTER API KEY TEST")
print("=" * 70)

print(f"\nAPI Key Status:")
if OPENROUTER_API_KEY:
    print(f"✓ Found: {OPENROUTER_API_KEY[:20]}...{OPENROUTER_API_KEY[-10:]}")
else:
    print("✗ NOT FOUND in .env")
    sys.exit(1)

# Test the primary model (Nemotron)
model = "nvidia/nemotron-3-super-120b-a12b:free"

print(f"\nTesting Model: {model}")
print("-" * 70)

try:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Nexus AI Chat"
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Say hello"}],
        "max_tokens": 20
    }
    
    print("Sending request to OpenRouter...")
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=45
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        msg = data['choices'][0]['message']['content']
        print(f"\n✓ SUCCESS!")
        print(f"Response: {msg}")
        print(f"Tokens: {data.get('usage', {})}")
    else:
        print(f"✗ Error {response.status_code}")
        print(f"Response: {response.text[:500]}")

except requests.exceptions.Timeout:
    print("⏱ Request timed out (model may be slow)")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {str(e)}")
