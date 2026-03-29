"""
Pytest configuration for Django tests.
Ensures .env file is loaded before tests run.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'

if env_file.exists():
    load_dotenv(env_file)
else:
    print(f"Warning: .env file not found at {env_file}")

# Verify API keys are loaded
openrouter_key = os.getenv('OPENROUTER_API_KEY')
groq_key = os.getenv('GROQ_API_KEY')

print(f"[pytest] OPENROUTER_API_KEY loaded: {bool(openrouter_key)}")
print(f"[pytest] GROQ_API_KEY loaded: {bool(groq_key)}")
