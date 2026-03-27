import os
import re
from pathlib import Path

SECRET_PATTERNS = [
    r'OPENROUTER_API_KEY\s*=\s*["\"][\w\-]+["\"]',
    r'GROQ_API_KEY\s*=\s*["\"][\w\-]+["\"]',
    r'TOGETHER_API_KEY\s*=\s*["\"][\w\-]+["\"]',
    r'sk-[\w\-]{20,}',
]


def iter_python_files(base_dir: Path):
    for root, _dirs, files in os.walk(base_dir):
        if 'venv' in root:
            continue
        for file_name in files:
            if file_name.endswith('.py'):
                yield Path(root) / file_name


def test_no_hardcoded_keys_in_backend():
    backend_dir = Path(__file__).resolve().parents[2] / 'backend'
    for file_path in iter_python_files(backend_dir):
        content = file_path.read_text(encoding='utf-8')
        for pattern in SECRET_PATTERNS:
            assert not re.search(pattern, content), f"Found potential secret in {file_path}"
