#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo -e "${RED}Missing required command: $cmd${NC}"
    exit 1
  fi
}

extract_numeric_version() {
  echo "$1" | sed -E 's/[^0-9]*([0-9]+(\.[0-9]+){0,2}).*/\1/'
}

require_major_version() {
  local cmd="$1"
  local required_major="$2"
  require_command "$cmd"
  local version_raw="$($cmd --version 2>&1)"
  local version="$(extract_numeric_version "$version_raw")"
  local major="${version%%.*}"
  if [[ -z "$major" ]]; then
    echo -e "${RED}Unable to parse version for $cmd${NC}"
    exit 1
  fi
  if (( major < required_major )); then
    echo -e "${RED}$cmd version $version_raw detected. Requires >= $required_major.x${NC}"
    exit 1
  fi
}

require_python_version() {
  local cmd="$1"
  require_command "$cmd"
  local version_raw="$($cmd --version 2>&1 | awk '{print $2}')"
  local major="${version_raw%%.*}"
  local minor_part="${version_raw#*.}"
  local minor="${minor_part%%.*}"
  if (( major < 3 )) || { (( major == 3 )) && (( minor < 10 )); }; then
    echo -e "${RED}$cmd version $version_raw detected. Requires >= 3.10${NC}"
    exit 1
  fi
}

# Determine which python command to use
if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=python3
else
  PYTHON_CMD=python
fi

require_major_version node 18
require_major_version npm 9
require_python_version "$PYTHON_CMD"

echo "Preflight checks passed"

# Create backend virtual environment if necessary
if [ ! -d "$BACKEND_DIR/venv" ]; then
  echo "Creating Python virtual environment..."
  (cd "$BACKEND_DIR" && "$PYTHON_CMD" -m venv venv)
fi

# Determine activation script
if [ -f "$BACKEND_DIR/venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "$BACKEND_DIR/venv/bin/activate"
elif [ -f "$BACKEND_DIR/venv/Scripts/activate" ]; then
  # shellcheck disable=SC1091
  source "$BACKEND_DIR/venv/Scripts/activate"
else
  echo -e "${RED}Unable to locate virtual environment activation script${NC}"
  exit 1
fi

echo "Setting up backend dependencies..."
pip install -q -r "$BACKEND_DIR/requirements.txt" >/dev/null

cd "$BACKEND_DIR"
if python manage.py migrate --check >/dev/null 2>&1; then
  echo "Database is up to date"
else
  echo "Applying pending migrations..."
  python manage.py migrate --noinput
fi
cd "$ROOT_DIR"

echo "Starting backend server..."
cd "$BACKEND_DIR"
python manage.py runserver 127.0.0.1:8000 > "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$ROOT_DIR"

sleep 2

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install --silent)
fi

echo "Starting frontend server..."
export REACT_APP_API_BASE_URL="http://127.0.0.1:8000/api"
cd "$FRONTEND_DIR"
CI=false npm start > "$ROOT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$ROOT_DIR"

sleep 3

if kill -0 "$BACKEND_PID" >/dev/null 2>&1 && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
  echo -e "${GREEN}Backend running on http://127.0.0.1:8000${NC}"
  echo -e "${GREEN}Frontend running on http://localhost:3000${NC}"
else
  echo -e "${RED}Failed to start services${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" >/dev/null 2>&1 || true
  exit 1
fi

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" >/dev/null 2>&1 || true
  echo 'Services stopped'
}

trap cleanup EXIT

wait
