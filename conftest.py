"""Project-level pytest configuration for shared integration tests."""

from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

# Ensure backend apps (config, chats, ai, etc.) are importable when running from repo root
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load backend/.env so integration tests pick up the same credentials/settings as Django apps
env_file = BACKEND_DIR / ".env"
if env_file.exists():
    load_dotenv(env_file)
