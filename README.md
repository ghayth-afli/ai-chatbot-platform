# nexus AI — Multi-Model Chatbot Platform

Phase 0 establishes the local development environment for the nexus AI platform. This repository contains a Django REST backend, a React frontend, and a one-command orchestration script so contributors can get productive immediately.

## Quick Start

```bash
./run.sh
```

The script provisions dependencies, applies database migrations, and starts both servers. When it finishes you should see:

```
Backend running on http://127.0.0.1:8000
Frontend running on http://localhost:3000
```

## Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Python 3.10+
- Git
- Bash shell (macOS, Linux, or Windows via WSL2)

Verify your versions:

```bash
node --version
npm --version
python3 --version
git --version
```

## Manual Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Backend setup:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
3. Frontend setup:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Project Structure

```
project/
├── backend/        # Django REST API
├── frontend/       # React app (React Router + Tailwind + i18next)
├── specs/          # Feature specs & planning artifacts
├── run.sh          # One-command startup script
├── .env            # Local environment variables (git-ignored)
├── .env.example    # Environment template
└── README.md       # This file
```

## Technology Stack

| Layer    | Technology                                                      |
| -------- | --------------------------------------------------------------- |
| Backend  | Python 3.10+, Django 5, DRF, django-cors-headers, python-dotenv |
| Frontend | React 18, React Router, Axios, Tailwind CSS, i18next            |
| Testing  | pytest + pytest-django, Jest, React Testing Library             |
| Database | SQLite (development)                                            |

## Contributing

1. Fork the repository and create a new branch from `001-environment-setup`.
2. Follow the instructions in `specs/001-environment-setup/tasks.md`.
3. Run `pytest` and `npm test` before submitting a PR.
4. Ensure `./run.sh` succeeds without manual intervention.

## License

This project is provided for development and evaluation. See `LICENSE` (to be added) for details.
