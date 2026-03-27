# Quickstart: Phase 0 — Environment Setup

**Status**: Ready for Development  
**Date**: 2026-03-27  
**Target**: Development (macOS / Linux / Windows WSL2)

---

## Overview

This quickstart gets the nexus AI multi-model chatbot platform running on your local machine in under 5 minutes.

**What you'll have after this guide**:

- ✅ Backend (Django REST API) running on http://127.0.0.1:8000
- ✅ Frontend (React) running on http://localhost:3000
- ✅ SQLite development database initialized
- ✅ Environment variables configured
- ✅ Ready for Phase 1 feature development

**Time required**: ~3-5 minutes (depending on internet speed)

---

## Prerequisites

Before starting, verify you have required software installed:

### macOS / Linux

```bash
# Check Node.js (should be >= 18)
node --version

# Check Python (should be >= 3.10)
python3 --version

# Check npm (should be >= 9)
npm --version

# Check Git
git --version
```

### Windows (WSL2 only)

```bash
# Open WSL2 terminal and run same checks as above
node --version
python3 --version
npm --version
```

**Missing something?** Install from:

- [Node.js LTS](https://nodejs.org/) — Installs node + npm
- [Python 3.10+](https://www.python.org/downloads/)
- Git is usually pre-installed; if not: [git-scm.com](https://git-scm.com/)

---

## Quick Start (One Command)

### Option A: Run Everything with One Command

```bash
# From project root
./run.sh
```

That's it! Both backend and frontend will start automatically.

**Expected output**:

```
Backend running on http://127.0.0.1:8000
Frontend running on http://localhost:3000
```

Then open your browser:

- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000/api/

---

## Step-by-Step Setup (if run.sh doesn't work)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-chatbot-platform
```

### 2. Environment Configuration

```bash
# Copy template to .env
cp .env.example .env

# Edit .env with your settings (API keys, etc.)
# You can leave most values empty for Phase 0
nano .env
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows (WSL2):
source venv/bin/activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start backend server
python manage.py runserver

# Should see: "Starting development server at http://127.0.0.1:8000/"
```

### 4. Frontend Setup (new terminal/tab)

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install npm dependencies
npm install

# Start development server
npm start

# Should see: "Compiled successfully!" and browser opens http://localhost:3000
```

---

## Project Structure

After setup, your project looks like:

```
project/
├── backend/                 # Django REST API
│   ├── venv/                # Python virtual environment
│   ├── manage.py            # Django management
│   ├── requirements.txt      # Python dependencies
│   ├── db.sqlite3           # Development database (auto-created)
│   ├── apps/
│   │   ├── users/           # User management app
│   │   ├── chats/           # Chat sessions app
│   │   ├── ai/              # AI routing app
│   │   ├── summaries/       # User summaries app
│   │   └── api/             # API configuration
│   └── config/              # Django settings
│
├── frontend/                # React application
│   ├── node_modules/        # npm dependencies
│   ├── public/              # Static files
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable components
│   │   ├── features/        # Feature modules (auth, chat, profile)
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── i18n/            # Translations (en.json, ar.json)
│   │   ├── pages/           # Page components
│   │   └── layouts/         # Layout components
│   └── package.json         # npm configuration
│
├── specs/                   # Feature specifications
├── .env                     # Environment variables (git-ignored)
├── run.sh                   # One-command startup script
├── README.md                # Project documentation
└── .gitignore               # Git ignore patterns
```

---

## Verification

### Backend Verification

```bash
# Check backend is running
curl http://127.0.0.1:8000/api/

# Should return API response (not 404)
# If error, check:
# 1. Virtual environment is activated
# 2. Database migrations ran (python manage.py migrate)
# 3. Port 8000 is not in use
```

### Frontend Verification

```bash
# Check frontend is accessible
curl http://localhost:3000

# Should return HTML (React app)
# If error, check:
# 1. npm dependencies installed (npm install)
# 2. Port 3000 is not in use
# 3. No build errors in terminal
```

### Database Verification

```bash
# Check database migrations applied
cd backend
python manage.py showmigrations

# Should show all migrations with [X] applied
# Should NOT show [ ] pending
```

---

## Common Issues & Fixes

### Issue: `Permission denied` when running run.sh

**Solution**: Make script executable

```bash
chmod +x run.sh
./run.sh
```

### Issue: Port 8000 already in use

**Solution**: Kill existing process or use different port

```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or run backend on different port
python manage.py runserver 8080
```

### Issue: Python virtual environment won't activate

**Solution**: Reinstall venv

```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: npm modules not found

**Solution**: Reinstall npm dependencies

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database migrations fail

**Solution**: Reset database

```bash
cd backend
rm db.sqlite3
python manage.py migrate
```

### Issue: CORS errors in browser console

**Solution**: Verify .env CORS_ALLOWED_ORIGINS setting

```bash
# Check .env
cat .env | grep CORS_ALLOWED_ORIGINS

# Should include: http://localhost:3000
# If not, edit .env and restart backend
```

---

## Development Workflow

### Daily Development

```bash
# From project root, one command starts everything
./run.sh

# Frontend hot-reloads on file changes
# Backend reloads on file changes

# To stop: Press Ctrl+C
```

### Backend Development

```bash
# Virtual environment must be active
cd backend
source venv/bin/activate

# Create new Django app
python manage.py startapp <appname>

# Create migrations for model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Open Django admin (Phase 1)
python manage.py createsuperuser  # Create admin user
# Then visit: http://127.0.0.1:8000/admin
```

### Frontend Development

```bash
cd frontend

# Add new npm package
npm install <package-name>

# React component hot-reload works automatically
# Edit src/ files and see changes immediately
```

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

---

## Environment Variables

### Required for Phase 0

```env
SECRET_KEY=development-key (can be anything for local dev)
DEBUG=True (enables detailed error pages)
```

### Optional for Phase 0, Required for Phase 1

```env
OPENROUTER_API_KEY=            # Your OpenRouter API key
GROQ_API_KEY=                  # Your Groq API key
TOGETHER_API_KEY=              # Your Together API key
JWT_SECRET=development-secret  # JWT signing key
DEFAULT_MODEL=deepseek         # Default AI model
```

Get API keys from:

- [OpenRouter](https://openrouter.ai)
- [Groq](https://groq.com)
- [Together](https://api.together.xyz)

---

## Next Steps

✅ **Phase 0 Complete**: Environment is set up and running

→ **Phase 1**: Start implementing authentication, chat system, and UI

For implementation tasks, see: [tasks.md](tasks.md)

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [i18next](https://www.i18next.com/)

---

## Support

**Having issues?** Check:

1. [Common Issues section](#common-issues--fixes) above
2. [project-constitution.md](../constitution.md) for architectural decisions
3. [data-model.md](data-model.md) for database schema
4. Backend logs: `tail -f backend.log`
5. Frontend logs: Check browser console (F12)

---

**Last Updated**: 2026-03-27  
**Status**: ✅ Ready for use
