#!/usr/bin/env python
"""
Test nemotron model through dispatch_to_provider
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

# Set Django settings BEFORE importing Django modules
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from dotenv import load_dotenv
backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'
load_dotenv(env_file)

# Now import the router
from chats.router import dispatch_to_provider

print("="*60)
print("Testing Nemotron Model")
print("="*60)
print()

print("Sending test message to nemotron model...")
result = dispatch_to_provider(
    'nemotron',
    'Say "Nemotron is working!" in one sentence.',
    'You are a helpful AI assistant.'
)

print(f"Result: {result}")
print()

if 'error' in result:
    print(f"✗ Error: {result['error']}")
else:
    print(f"✓ Success!")
    print(f"Response: {result['response']}")
    print(f"Tokens: {result.get('tokens', 'N/A')}")

print()
print("="*60)
