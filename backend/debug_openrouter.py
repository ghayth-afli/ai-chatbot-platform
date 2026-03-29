#!/usr/bin/env python
"""
Debug OpenRouter responses
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

print(f"API Key: {openrouter_key}")
print()

# Test models endpoint
print("Getting models endpoint response...")
headers = {
    'Authorization': f'Bearer {openrouter_key}',
}

try:
    response = requests.get('https://openrouter.io/api/v1/models', headers=headers, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Content Length: {len(response.content)}")
    print(f"Raw Content (first 500 chars): {response.text[:500]}")
    print(f"Raw Content (last 500 chars): {response.text[-500:]}")
except Exception as e:
    print(f"Exception: {str(e)}")
    import traceback
    traceback.print_exc()
