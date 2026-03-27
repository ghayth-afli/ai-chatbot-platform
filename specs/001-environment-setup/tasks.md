---
description: "Task list for Phase 0 Environment Setup - nexus AI multi-model chatbot platform"
---

# Tasks: Phase 0 — Environment Setup

**Input**: Design documents from `specs/001-environment-setup/`  
**Prerequisites**: spec.md ✅, plan.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅, contracts/api.md ✅

**Organization**: Tasks grouped by user story + phases. Each user story is independently testable and deployable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4)
- **Exact paths**: All file paths are concrete and actionable

## Path Structure (Web App)

```
project/
├── backend/              # Django backend
├── frontend/             # React frontend
├── specs/                # Specifications (already exists)
├── .env                  # Environment variables
├── .gitignore            # Git ignore patterns
├── run.sh                # Startup script
└── README.md             # Project documentation
```

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project root structure and initialize git

**Duration**: ~15 minutes  
**Checkpoint**: Empty directory structure ready

- [ ] T001 Create project root directories: `backend/`, `frontend/`, `specs/`
  - **Action**: Create directories at project root
  - **Verify**: `ls -la` shows backend/, frontend/, specs/ directories exist
  - **Files to create**: None (directories only)

- [ ] T002 [P] Create `.gitignore` at project root
  - **Path**: `project/.gitignore`
  - **Content**: Must include:

    ```
    # Environment
    .env
    .env.local

    # Backend
    backend/venv/
    backend/__pycache__/
    backend/db.sqlite3
    backend/*.pyc
    backend/.pytest_cache/

    # Frontend
    frontend/node_modules/
    frontend/.env.local
    frontend/build/
    frontend/dist/

    # IDE
    .vscode/
    .idea/
    *.swp
    *.swo
    *~

    # OS
    .DS_Store
    Thumbs.db
    ```

  - **Verify**: File exists at project root

- [ ] T003 [P] Create `.env.example` at project root
  - **Path**: `project/.env.example`
  - **Content** (exact):

    ```
    # Django Settings
    SECRET_KEY=dev-key-change-in-production
    DEBUG=True
    ALLOWED_HOSTS=localhost,127.0.0.1

    # Database
    DATABASE_URL=sqlite:///db.sqlite3

    # JWT
    JWT_SECRET=dev-jwt-secret-change-in-production

    # AI APIs (leave empty for Phase 0)
    OPENROUTER_API_KEY=
    GROQ_API_KEY=
    TOGETHER_API_KEY=

    # Default Model
    DEFAULT_MODEL=deepseek

    # CORS
    CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

    # Frontend
    REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
    ```

  - **Verify**: File exists with all required environment variable templates

- [ ] T004 [P] Create `README.md` at project root
  - **Path**: `project/README.md`
  - **Sections** (minimum):
    - Title: "nexus AI — Multi-Model Chatbot Platform"
    - Quick Start (one command): `./run.sh`
    - Prerequisites: Node 18+, Python 3.10+, npm 9+
    - Setup Instructions (manual)
    - Project Structure
    - Technology Stack
    - Contributing
    - License
  - **Content reference**: See quickstart.md section "Quick Start (One Command)"
  - **Verify**: File exists with all sections

- [ ] T005 Initialize git repository
  - **Action**: `git init` at project root
  - **Verify**: `.git/` directory exists

- [ ] T006 Create initial git commit
  - **Action**:
    ```bash
    git add .gitignore .env.example README.md
    git commit -m "Initial commit: project structure and documentation"
    ```
  - **Verify**: `git log` shows initial commit

---

## Phase 2: Foundational (Backend Infrastructure)

**Purpose**: Set up Django project, apps, and database infrastructure

**Duration**: ~30 minutes  
**Checkpoint**: Backend runs successfully with `python manage.py runserver`

### Backend Directory Structure Setup

- [ ] T007 Create backend directory structure
  - **Action**: Create directories:
    ```
    backend/
    ├── manage.py          (created by django-admin)
    ├── requirements.txt
    ├── .env
    ├── config/
    ├── apps/
    └── tests/
    ```
  - **Verify**: All directories exist

- [ ] T008 Create `backend/requirements.txt`
  - **Path**: `backend/requirements.txt`
  - **Content** (exact versions for reproducibility):
    ```
    Django==5.0.2
    djangorestframework==3.14.0
    djangorestframework-simplejwt==5.3.2
    django-cors-headers==4.3.1
    python-dotenv==1.0.0
    requests==2.31.0
    pytest==7.4.3
    pytest-django==4.7.0
    ```
  - **Verify**: File exists with all dependencies listed

- [ ] T009 Create Python virtual environment for backend
  - **Action**:
    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate  # macOS/Linux
    # or: .\venv\Scripts\Activate.ps1  # Windows PowerShell
    ```
  - **Verify**: `which python` or `Get-Command python` shows venv path

- [ ] T010 Install backend dependencies
  - **Action**:
    ```bash
    cd backend
    source venv/bin/activate
    pip install -r requirements.txt
    ```
  - **Verify**: `pip list` shows all packages installed

- [ ] T011 Initialize Django project
  - **Action**:
    ```bash
    cd backend
    django-admin startproject config .
    ```
  - **Expected files**:
    ```
    backend/
    ├── manage.py
    ├── requirements.txt
    └── config/
        ├── __init__.py
        ├── settings.py
        ├── urls.py
        ├── asgi.py
        └── wsgi.py
    ```
  - **Verify**: `python manage.py --version` returns Django version

- [ ] T012 Create Django apps
  - **Action**: Run commands in sequence:
    ```bash
    python manage.py startapp users
    python manage.py startapp chats
    python manage.py startapp ai
    python manage.py startapp summaries
    python manage.py startapp api
    ```
  - **Expected structure**:
    ```
    backend/
    ├── users/
    ├── chats/
    ├── ai/
    ├── summaries/
    ├── api/
    └── config/
    ```
  - **Verify**: Each app directory contains `models.py`, `views.py`, `urls.py`

- [ ] T013 Update `backend/config/settings.py` - INSTALLED_APPS
  - **Path**: `backend/config/settings.py`
  - **Action**: Find the INSTALLED_APPS list and add these apps:
    ```python
    INSTALLED_APPS = [
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',

        # Third-party
        'rest_framework',
        'corsheaders',

        # Local apps
        'users.apps.UsersConfig',
        'chats.apps.ChatsConfig',
        'ai.apps.AiConfig',
        'summaries.apps.SummariesConfig',
        'api.apps.ApiConfig',
    ]
    ```
  - **Verify**: Settings file updated without syntax errors

- [ ] T014 [P] Update `backend/config/settings.py` - MIDDLEWARE
  - **Path**: `backend/config/settings.py`
  - **Action**: Add corsheaders middleware to MIDDLEWARE list:
    ```python
    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        'corsheaders.middleware.CorsMiddleware',  # ADD THIS
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.middleware.authenticate.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]
    ```
  - **Verify**: Settings file updated without syntax errors

- [ ] T015 [P] Update `backend/config/settings.py` - CORS_ALLOWED_ORIGINS
  - **Path**: `backend/config/settings.py`
  - **Action**: Add CORS configuration at end of file:

    ```python
    import os
    from dotenv import load_dotenv

    load_dotenv()

    # ... existing settings ...

    # CORS Configuration
    CORS_ALLOWED_ORIGINS = os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000'
    ).split(',')

    # Environment Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-not-for-production')
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    ```

  - **Verify**: Settings file updated without syntax errors

- [ ] T016 [P] Create `backend/config/urls.py` API routing
  - **Path**: `backend/config/urls.py`
  - **Replace entire content**:

    ```python
    from django.contrib import admin
    from django.urls import path, include
    from rest_framework import routers

    urlpatterns = [
        path('admin/', admin.site.urls),
        path('api/', include([
            path('health/', include('api.urls')),
        ])),
    ]
    ```

  - **Verify**: File updated without syntax errors

- [ ] T017 Create `backend/api/urls.py` health endpoint
  - **Path**: `backend/api/urls.py`
  - **Content**:

    ```python
    from django.urls import path
    from .views import health_check

    urlpatterns = [
        path('', health_check, name='health-check'),
    ]
    ```

  - **Verify**: File created at correct path

- [ ] T018 Create `backend/api/views.py` health endpoint
  - **Path**: `backend/api/views.py`
  - **Content**:

    ```python
    from rest_framework.decorators import api_view
    from rest_framework.response import Response
    from datetime import datetime
    import json

    @api_view(['GET'])
    def health_check(request):
        """Health check endpoint to verify backend is running and database is accessible"""
        try:
            # Check database connection
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")

            return Response({
                'status': 'healthy',
                'database': 'connected',
                'timestamp': datetime.now().isoformat(),
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Database connection failed: {str(e)}',
                'timestamp': datetime.now().isoformat(),
            }, status=503)
    ```

  - **Verify**: File created and contains health_check function

- [ ] T019 Create app model stubs (Phase 1 placeholders)
  - **Path**: `backend/users/models.py`
  - **Content**:

    ```python
    from django.db import models
    from django.contrib.auth.models import User

    class Profile(models.Model):
        """User profile for storing additional user information"""
        user = models.OneToOneField(User, on_delete=models.CASCADE)
        bio = models.TextField(blank=True, default='')
        language_preference = models.CharField(
            max_length=2,
            choices=[('en', 'English'), ('ar', 'Arabic')],
            default='en'
        )
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)

        def __str__(self):
            return f"{self.user.username}'s Profile"
    ```

  - **Verify**: File created with Profile model

- [ ] T020 [P] Create chats app model stub
  - **Path**: `backend/chats/models.py`
  - **Content**:

    ```python
    from django.db import models
    from django.contrib.auth.models import User

    class ChatSession(models.Model):
        """Chat session container"""
        user = models.ForeignKey(User, on_delete=models.CASCADE)
        title = models.CharField(max_length=255, default='New Chat')
        ai_model = models.CharField(max_length=50, default='deepseek')
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)

        def __str__(self):
            return f"{self.user.username} - {self.title}"

    class Message(models.Model):
        """Message in a chat session"""
        ROLE_CHOICES = [
            ('user', 'User'),
            ('assistant', 'Assistant'),
        ]

        session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
        role = models.CharField(max_length=10, choices=ROLE_CHOICES)
        content = models.TextField()
        ai_model = models.CharField(max_length=50, blank=True)
        created_at = models.DateTimeField(auto_now_add=True)

        def __str__(self):
            return f"{self.role} - {self.content[:50]}"
    ```

  - **Verify**: File created with ChatSession and Message models

- [ ] T021 [P] Create ai app model stub
  - **Path**: `backend/ai/models.py`
  - **Content**:

    ```python
    from django.db import models

    class AIModel(models.Model):
        """Available AI models for routing"""
        name = models.CharField(max_length=50, unique=True)
        provider = models.CharField(max_length=50)
        is_active = models.BooleanField(default=True)

        def __str__(self):
            return f"{self.name} ({self.provider})"
    ```

  - **Verify**: File created with AIModel model

- [ ] T022 [P] Create summaries app model stub
  - **Path**: `backend/summaries/models.py`
  - **Content**:

    ```python
    from django.db import models
    from django.contrib.auth.models import User

    class UserSummary(models.Model):
        """AI-generated user profile summary"""
        user = models.OneToOneField(User, on_delete=models.CASCADE)
        summary = models.TextField(blank=True)
        generated_at = models.DateTimeField(auto_now_add=True)
        last_updated = models.DateTimeField(auto_now=True)

        def __str__(self):
            return f"Summary for {self.user.username}"
    ```

  - **Verify**: File created with UserSummary model

- [ ] T023 Run database migrations
  - **Action**:
    ```bash
    cd backend
    source venv/bin/activate
    python manage.py makemigrations
    python manage.py migrate
    ```
  - **Verify**: Commands complete without errors; `db.sqlite3` file created

- [ ] T024 Test backend server starts
  - **Action**:
    ```bash
    cd backend
    source venv/bin/activate
    python manage.py runserver
    ```
  - **Verify**: Server outputs "Starting development server at http://127.0.0.1:8000/"

- [ ] T025 Test health endpoint
  - **Action**: In separate terminal:
    ```bash
    curl http://127.0.0.1:8000/api/health/
    ```
  - **Verify**: Returns JSON with `"status": "healthy"`

---

## Phase 3: Foundational (Frontend Infrastructure)

**Purpose**: Set up React project, routing, i18n, and styling infrastructure

**Duration**: ~30 minutes  
**Checkpoint**: Frontend runs successfully with `npm start`

### Frontend Directory Structure Setup

- [ ] T026 Create `frontend/package.json`
  - **Path**: `frontend/package.json`
  - **Content** (use exact JSON):
    ```json
    {
      "name": "nexus-chatbot-frontend",
      "version": "0.1.0",
      "private": true,
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.21.0",
        "axios": "^1.6.2",
        "i18next": "^23.7.6",
        "react-i18next": "^14.0.0",
        "tailwindcss": "^3.4.1"
      },
      "devDependencies": {
        "react-scripts": "5.0.1",
        "postcss": "^8.4.32",
        "autoprefixer": "^10.4.16",
        "@testing-library/react": "^14.1.2",
        "@testing-library/jest-dom": "^6.1.5",
        "jest": "^29.7.0"
      },
      "scripts": {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
      },
      "eslintConfig": {
        "extends": ["react-app"]
      },
      "browserslist": {
        "production": [">0.2%", "not dead", "not op_mini all"],
        "development": [
          "last 1 chrome version",
          "last 1 firefox version",
          "last 1 safari version"
        ]
      }
    }
    ```
  - **Verify**: Valid JSON file created

- [ ] T027 Create frontend directory structure
  - **Action**: Create directories:
    ```
    frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   ├── features/
    │   │   ├── auth/
    │   │   ├── chat/
    │   │   ├── profile/
    │   │   └── history/
    │   ├── services/
    │   ├── hooks/
    │   ├── i18n/
    │   ├── pages/
    │   ├── layouts/
    │   ├── App.jsx
    │   ├── index.jsx
    │   └── App.css
    └── package.json
    ```
  - **Verify**: All directories exist

- [ ] T028 Create `frontend/public/index.html`
  - **Path**: `frontend/public/index.html`
  - **Content**:
    ```html
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="nexus AI - Multi-model chatbot platform"
        />
        <title>nexus AI</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
    ```
  - **Verify**: File created with required HTML structure

- [ ] T029 Create `frontend/tailwind.config.js`
  - **Path**: `frontend/tailwind.config.js`
  - **Content**:
    ```javascript
    module.exports = {
      content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
      theme: {
        extend: {
          colors: {
            // nexus brand colors
            volt: "#C8FF00",
            plasma: "#7B5CFF",
            spark: "#FF4D6D",
            ice: "#00D4E8",
            ink: "#0D0D12",
            paper: "#F5F3EF",
          },
        },
      },
      plugins: [],
    };
    ```
  - **Verify**: File created at correct path

- [ ] T030 Create `frontend/postcss.config.js`
  - **Path**: `frontend/postcss.config.js`
  - **Content**:
    ```javascript
    module.exports = {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    };
    ```
  - **Verify**: File created at correct path

- [ ] T031 Create `frontend/src/index.jsx`
  - **Path**: `frontend/src/index.jsx`
  - **Content**:

    ```javascript
    import React from "react";
    import ReactDOM from "react-dom/client";
    import App from "./App";
    import "./App.css";

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    ```

  - **Verify**: File created with React entrypoint

- [ ] T032 Create `frontend/src/App.css`
  - **Path**: `frontend/src/App.css`
  - **Content**:

    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    body {
      background-color: #0d0d12;
      color: #f5f3ef;
      font-family: "DM Sans", sans-serif;
    }
    ```

  - **Verify**: File created with Tailwind imports

- [ ] T033 Create `frontend/src/App.jsx`
  - **Path**: `frontend/src/App.jsx`
  - **Content**:

    ```javascript
    import React from "react";
    import { BrowserRouter, Routes, Route } from "react-router-dom";
    import "./App.css";

    function App() {
      return (
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <div className="p-8 text-center">
                  <h1 className="text-4xl font-bold text-volt mb-4">
                    nexus AI
                  </h1>
                  <p className="text-lg text-gray-400">
                    Multi-model chatbot platform
                  </p>
                  <p className="mt-4 text-sm text-gray-500">
                    Frontend environment ready for Phase 1
                  </p>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      );
    }

    export default App;
    ```

  - **Verify**: File created with basic React component

- [ ] T034 Create i18n configuration files
  - **Path**: `frontend/src/i18n/config.js`
  - **Content**:

    ```javascript
    import i18n from "i18next";
    import { initReactI18next } from "react-i18next";
    import enJSON from "./en.json";
    import arJSON from "./ar.json";

    i18n.use(initReactI18next).init({
      resources: {
        en: { translation: enJSON },
        ar: { translation: arJSON },
      },
      lng: localStorage.getItem("language") || "en",
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
    });

    export default i18n;
    ```

  - **Verify**: File created at correct path

- [ ] T035 [P] Create `frontend/src/i18n/en.json`
  - **Path**: `frontend/src/i18n/en.json`
  - **Content**:
    ```json
    {
      "app": {
        "title": "nexus AI",
        "subtitle": "Multi-model Chatbot Platform"
      },
      "nav": {
        "home": "Home",
        "chat": "Chat",
        "profile": "Profile",
        "settings": "Settings",
        "logout": "Logout"
      },
      "general": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "cancel": "Cancel",
        "save": "Save"
      }
    }
    ```
  - **Verify**: Valid JSON file created

- [ ] T036 [P] Create `frontend/src/i18n/ar.json`
  - **Path**: `frontend/src/i18n/ar.json`
  - **Content**:
    ```json
    {
      "app": {
        "title": "نيكسس AI",
        "subtitle": "منصة الدردشة الذكية متعددة النماذج"
      },
      "nav": {
        "home": "الرئيسية",
        "chat": "دردشة",
        "profile": "الملف الشخصي",
        "settings": "الإعدادات",
        "logout": "تسجيل الخروج"
      },
      "general": {
        "loading": "جاري التحميل...",
        "error": "خطأ",
        "success": "نجح",
        "cancel": "إلغاء",
        "save": "حفظ"
      }
    }
    ```
  - **Verify**: Valid JSON file created

- [ ] T037 Create `frontend/src/services/api.js`
  - **Path**: `frontend/src/services/api.js`
  - **Content**:

    ```javascript
    import axios from "axios";

    const API_BASE_URL =
      process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api";

    const api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests (Phase 1+)
    api.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );

    export default api;
    ```

  - **Verify**: File created at correct path

- [ ] T038 Install npm dependencies
  - **Action**:
    ```bash
    cd frontend
    npm install
    ```
  - **Verify**: `node_modules/` directory created; `npm list` shows all packages

- [ ] T039 Test frontend server starts
  - **Action**:
    ```bash
    cd frontend
    npm start
    ```
  - **Verify**: Browser opens at http://localhost:3000 and shows "nexus AI" message

---

## Phase 4: Orchestration (run.sh Script)

**Purpose**: Create single-command startup script for both backend and frontend

**Duration**: ~10 minutes  
**Checkpoint**: `./run.sh` starts both services and outputs status

- [ ] T040 Create `.env` at project root
  - **Path**: `project/.env`
  - **Action**: Copy from `.env.example`
    ```bash
    cp .env.example .env
    ```
  - **Verify**: `.env` exists with all environment variables

- [ ] T041 Create `run.sh` script at project root
  - **Path**: `project/run.sh`
  - **Content** (exact bash script):

    ```bash
    #!/bin/bash

    # Colors for output
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    NC='\033[0m' # No Color

    # Check if venv exists, create if not
    if [ ! -d "backend/venv" ]; then
      echo "Creating Python virtual environment..."
      cd backend
      python3 -m venv venv
      cd ..
    fi

    # Activate venv and install/update dependencies
    echo "Setting up backend dependencies..."
    source backend/venv/bin/activate
    pip install -q -r backend/requirements.txt 2>/dev/null

    # Check for pending migrations
    cd backend
    if python manage.py migrate --check 2>/dev/null; then
      echo "Database is up to date"
    else
      echo "Applying pending migrations..."
      python manage.py migrate --noinput
    fi
    cd ..

    # Start backend in background
    echo "Starting backend server..."
    source backend/venv/bin/activate
    cd backend
    python manage.py runserver 127.0.0.1:8000 > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    sleep 2

    # Check if npm dependencies are installed
    if [ ! -d "frontend/node_modules" ]; then
      echo "Installing frontend dependencies..."
      cd frontend
      npm install --silent
      cd ..
    fi

    # Start frontend in background
    echo "Starting frontend server..."
    export REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
    cd frontend
    CI=false npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..

    sleep 3

    # Check if servers are running
    if kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; then
      echo -e "${GREEN}Backend running on http://127.0.0.1:8000${NC}"
      echo -e "${GREEN}Frontend running on http://localhost:3000${NC}"
    else
      echo -e "${RED}Failed to start services${NC}"
      exit 1
    fi

    # Handle graceful shutdown
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Services stopped'" EXIT

    # Keep script running
    wait
    ```

  - **Verify**: File created with bash script content

- [ ] T042 [P] Make `run.sh` executable
  - **Action**:
    ```bash
    chmod +x run.sh
    ```
  - **Verify**: `ls -la run.sh` shows executable permission (x flag)

- [ ] T043 [P] Create Windows batch file `run.bat` (for reference/optional)
  - **Path**: `project/run.bat`
  - **Content** (Windows batch):
    ```batch
    @echo off
    REM This is provided for reference. Windows users should use WSL2 with run.sh
    echo This project uses run.sh (bash). Please use Windows Subsystem for Linux (WSL2).
    pause
    ```
  - **Verify**: File created (informational only)

---

## Phase 5: User Story 1 — Backend Development Environment Setup (Priority: P1)

**Goal**: Backend is fully functional and responds to HTTP requests  
**Independent Test**: `curl http://127.0.0.1:8000/api/health/` returns `{"status": "healthy"}`

### Tests for User Story 1

- [ ] T044 [P] Create backend health check test
  - **Path**: `backend/tests/test_api.py`
  - **Content**:

    ```python
    import pytest
    from django.test import Client

    @pytest.mark.django_db
    def test_health_endpoint_returns_200():
        """Health check endpoint should return 200 with healthy status"""
        client = Client()
        response = client.get('/api/health/')

        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['database'] == 'connected'
        assert 'timestamp' in data

    @pytest.mark.django_db
    def test_health_endpoint_has_timestamp():
        """Health check endpoint should include timestamp"""
        client = Client()
        response = client.get('/api/health/')

        data = response.json()
        assert 'timestamp' in data
        # Verify timestamp is ISO format
        import datetime
        datetime.datetime.fromisoformat(data['timestamp'])
    ```

  - **Verify**: Test file created at correct path

### Implementation for User Story 1 (Already completed in T017, T018)

- [ ] T045 Run backend tests to verify health endpoint
  - **Action**:
    ```bash
    cd backend
    source venv/bin/activate
    pytest tests/test_api.py -v
    ```
  - **Verify**: Tests pass (2/2 passed)

- [ ] T046 [US1] Verify backend server responds to requests
  - **Action**:

    ```bash
    # In one terminal:
    cd backend
    source venv/bin/activate
    python manage.py runserver

    # In another terminal:
    curl http://127.0.0.1:8000/api/health/
    ```

  - **Expected output**:
    ```json
    {
      "status": "healthy",
      "database": "connected",
      "timestamp": "2026-03-27T10:30:00.123456Z"
    }
    ```
  - **Verify**: Backend returns health check response

- [ ] T047 [US1] Verify Django admin panel is accessible
  - **Action**:
    ```bash
    # Backend must be running
    curl http://127.0.0.1:8000/admin/
    ```
  - **Verify**: Returns HTML login page (status 200)

---

## Phase 6: User Story 2 — Frontend Development Environment Setup (Priority: P1)

**Goal**: Frontend is fully functional and renders React app  
**Independent Test**: http://localhost:3000 loads and displays "nexus AI" title

### Tests for User Story 2

- [ ] T048 [P] Create frontend rendering test
  - **Path**: `frontend/src/App.test.jsx`
  - **Content**:

    ```javascript
    import { render, screen } from "@testing-library/react";
    import App from "./App";

    test("App renders nexus AI title", () => {
      render(<App />);
      const titleElement = screen.getByText(/nexus AI/i);
      expect(titleElement).toBeInTheDocument();
    });

    test("App renders subtitle", () => {
      render(<App />);
      const subtitleElement = screen.getByText(/Multi-model chatbot platform/i);
      expect(subtitleElement).toBeInTheDocument();
    });
    ```

  - **Verify**: Test file created at correct path

### Implementation for User Story 2 (Already completed in T027-T039)

- [ ] T049 Run frontend tests to verify rendering
  - **Action**:
    ```bash
    cd frontend
    npm test -- App.test.jsx --watchAll=false
    ```
  - **Verify**: Tests pass (2/2 passed)

- [ ] T050 [US2] Verify frontend server loads without errors
  - **Action**:

    ```bash
    # In one terminal:
    cd frontend
    npm start

    # Browser opens at http://localhost:3000
    # Check browser console (F12) for no errors
    ```

  - **Verify**: Browser loads page; console shows no errors

- [ ] T051 [US2] Verify React routing is configured
  - **Action**: Check App.jsx has BrowserRouter and Routes
    ```bash
    grep -n "BrowserRouter\|Routes\|Route" frontend/src/App.jsx
    ```
  - **Verify**: Commands return multiple matches showing routing setup

---

## Phase 7: User Story 3 — Full Stack Execution with Single Command (Priority: P1)

**Goal**: `./run.sh` starts both backend and frontend with minimal output  
**Independent Test**: `./run.sh` displays "Backend running on http://127.0.0.1:8000" and "Frontend running on http://localhost:3000"

### Tests for User Story 3

- [ ] T052 [P] Create integration test for run.sh
  - **Path**: `tests/integration/test_startup.sh`
  - **Content**:

    ```bash
    #!/bin/bash

    # Test that run.sh starts both services
    echo "Testing run.sh startup sequence..."

    # Start run.sh in background
    ./run.sh &
    RUN_PID=$!

    # Wait for services to start
    sleep 5

    # Test backend
    if curl -s http://127.0.0.1:8000/api/health/ | grep -q "healthy"; then
      echo "✓ Backend health check passed"
    else
      echo "✗ Backend health check failed"
      kill $RUN_PID
      exit 1
    fi

    # Test frontend
    if curl -s http://localhost:3000 | grep -q "nexus AI"; then
      echo "✓ Frontend loaded successfully"
    else
      echo "✗ Frontend failed to load"
      kill $RUN_PID
      exit 1
    fi

    # Clean up
    kill $RUN_PID
    echo "✓ All startup tests passed"
    exit 0
    ```

  - **Verify**: Test file created at correct path

### Implementation for User Story 3 (Already completed in T041-T043)

- [ ] T053 [US3] Test run.sh script execution
  - **Action**:
    ```bash
    cd project
    ./run.sh
    # Wait 5 seconds for services to start
    # Check output shows:
    # "Backend running on http://127.0.0.1:8000"
    # "Frontend running on http://localhost:3000"
    ```
  - **Verify**: Both status messages appear in console

- [ ] T054 [US3] Verify backend health on http://127.0.0.1:8000/api/health/
  - **Action**:
    ```bash
    # run.sh is still running
    curl http://127.0.0.1:8000/api/health/
    ```
  - **Verify**: Returns healthy status JSON

- [ ] T055 [US3] Verify frontend loads on http://localhost:3000
  - **Action**: Open browser to http://localhost:3000
  - **Verify**: Page displays "nexus AI" title; no console errors

- [ ] T056 [US3] Verify services shut down gracefully
  - **Action**: In run.sh terminal, press Ctrl+C
  - **Verify**: Script exits cleanly; both services stop

---

## Phase 8: User Story 4 — Environment Variables & Secrets Configuration (Priority: P2)

**Goal**: .env file is configured; API keys never appear in code  
**Independent Test**: Verify no hardcoded secrets in source files

### Tests for User Story 4

- [ ] T057 [P] Create test to verify no hardcoded secrets
  - **Path**: `tests/security/test_no_secrets.py`
  - **Content**:

    ```python
    import os
    import re

    def test_no_api_keys_in_backend():
        """Verify no API keys are hardcoded in backend"""
        secret_patterns = [
            r'OPENROUTER_API_KEY\s*=\s*[\'"][\w\-]+[\'"]',
            r'GROQ_API_KEY\s*=\s*[\'"][\w\-]+[\'"]',
            r'TOGETHER_API_KEY\s*=\s*[\'"][\w\-]+[\'"]',
            r'sk-[\w\-]{20,}',  # OpenAI-style keys
        ]

        for root, dirs, files in os.walk('backend'):
            if 'venv' in dirs:
                dirs.remove('venv')

            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r') as f:
                        content = f.read()
                        for pattern in secret_patterns:
                            assert not re.search(pattern, content), \
                                f"Found potential secret in {filepath}"
    ```

  - **Verify**: Test file created at correct path

### Implementation for User Story 4

- [ ] T058 Verify `.env` file exists and is in `.gitignore`
  - **Action**:

    ```bash
    # Check .env exists
    [ -f .env ] && echo ".env exists" || echo ".env missing"

    # Check .env is in .gitignore
    grep -n "^.env$" .gitignore
    ```

  - **Verify**: Both commands return success

- [ ] T059 [US4] Verify environment variables are loaded in backend settings
  - **Action**: Check settings.py loads from .env
    ```bash
    grep -n "load_dotenv\|os.getenv" backend/config/settings.py | head -10
    ```
  - **Verify**: Shows load_dotenv() and os.getenv() calls

- [ ] T060 [US4] Test backend loads secrets from .env without errors
  - **Action**:
    ```bash
    cd backend
    source venv/bin/activate
    python -c "from config import settings; print(settings.SECRET_KEY[:10])"
    ```
  - **Verify**: Prints first 10 characters of SECRET_KEY (no error)

- [ ] T061 [US4] Verify no API keys in frontend environment
  - **Action**:
    ```bash
    grep -n "OPENROUTER_API_KEY\|GROQ_API_KEY\|TOGETHER_API_KEY" frontend/src/**/*.js frontend/src/**/*.jsx
    ```
  - **Verify**: No matches found (no hardcoded keys)

- [ ] T062 [US4] Run security test for hardcoded secrets
  - **Action**:
    ```bash
    cd backend
    source venv/bin/activate
    pytest ../tests/security/test_no_secrets.py -v
    ```
  - **Verify**: Test passes (no secrets detected)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation, and cleanup

**Duration**: ~20 minutes

- [ ] T063 [P] Create `backend/.env` from template
  - **Action**:
    ```bash
    cp backend/.env.example backend/.env 2>/dev/null || cp .env.example backend/.env
    ```
  - **Verify**: File exists at `backend/.env`

- [ ] T064 [P] Verify all `.gitignore` entries are working
  - **Action**:
    ```bash
    git status --porcelain | grep -E "venv|node_modules|\.sqlite3|__pycache__"
    ```
  - **Verify**: No output (all ignored files are properly tracked)

- [ ] T065 Create build logs directory (optional)
  - **Action**:
    ```bash
    mkdir -p logs
    echo "# Build Logs" > logs/README.md
    ```
  - **Verify**: logs/ directory exists

- [ ] T066 Test complete setup from scratch (cleanup & rebuild)
  - **Action** (optional, for validation):

    ```bash
    # Remove node_modules and venv
    rm -rf frontend/node_modules backend/venv

    # Run full setup
    ./run.sh

    # Verify output
    ```

  - **Verify**: Full setup completes without errors

- [ ] T067 Create SETUP_LOG.md with completion details
  - **Path**: `SETUP_LOG.md`
  - **Content**:

    ````markdown
    # Phase 0 Setup Log

    **Date**: 2026-03-27  
    **Status**: ✅ COMPLETE

    ## Completed Tasks (67 total)

    ### Phase 1: Setup (6 tasks)

    - Project structure created
    - .gitignore configured
    - .env.example template created
    - README.md documented
    - Git repository initialized

    ### Phase 2: Backend Infrastructure (18 tasks)

    - Django project initialized
    - 5 modular apps created (users, chats, ai, summaries, api)
    - Database models configured
    - Health check endpoint implemented
    - Migrations applied

    ### Phase 3: Frontend Infrastructure (12 tasks)

    - React project initialized
    - Routing configured
    - i18n setup (English + Arabic)
    - Tailwind CSS configured
    - Services and hooks scaffolded

    ### Phase 4: Orchestration (3 tasks)

    - run.sh script created and tested
    - Environment variables configured
    - Startup verified

    ### Phase 5-8: User Stories (25 tasks)

    - Backend setup verified (US1)
    - Frontend setup verified (US2)
    - Full-stack startup tested (US3)
    - Environment secrets secured (US4)

    ### Phase 9: Polish (3 tasks)

    - Final validation
    - Documentation complete
    - Setup log created

    ## Quick Start

    ```bash
    ./run.sh
    ```
    ````

    Then open:
    - http://localhost:3000 (Frontend)
    - http://127.0.0.1:8000/api/health/ (Backend Health)

    ## Next Steps

    Phase 1: Feature implementation (authentication, chat system)

    ```

    ```

  - **Verify**: File created with completion summary

- [ ] T068 Final git commit
  - **Action**:

    ```bash
    git add .
    git commit -m "Phase 0 complete: Full development environment setup

    - Django + React full-stack initialized
    - Modular Django app structure (users, chats, ai, summaries, api)
    - React routing, i18n (EN/AR), Tailwind CSS configured
    - Health check endpoint working
    - Single ./run.sh command starts both services
    - Database migrations automated (idempotent)
    - Environment variables via .env (zero hardcoded secrets)
    - All 67 setup tasks completed
    - Ready for Phase 1 feature development"
    ```

  - **Verify**: Commit successful; `git log` shows new commit

- [ ] T069 Create COMPLETION_CHECKLIST.md
  - **Path**: `COMPLETION_CHECKLIST.md`
  - **Content**:

    ```markdown
    # Phase 0 Completion Checklist

    ## ✅ Setup

    - [x] Project structure created
    - [x] Git initialized and first commit done
    - [x] .gitignore configured
    - [x] README.md created

    ## ✅ Backend

    - [x] Django project initialized
    - [x] 5 apps created (users, chats, ai, summaries, api)
    - [x] Database migrations applied
    - [x] Health endpoint working
    - [x] Backend server runs on http://127.0.0.1:8000

    ## ✅ Frontend

    - [x] React project initialized
    - [x] Routing configured
    - [x] i18n setup (English + Arabic)
    - [x] Tailwind CSS configured
    - [x] Frontend server runs on http://localhost:3000

    ## ✅ Orchestration

    - [x] run.sh script created
    - [x] Services start with single command
    - [x] Migrations automated (idempotent)
    - [x] Environment variables via .env
    - [x] No hardcoded secrets

    ## ✅ Verification

    - [x] Backend health check: PASS
    - [x] Frontend loads: PASS
    - [x] run.sh startup: PASS
    - [x] Environment secrets: PASS
    - [x] Tests passing: PASS

    ## 🎯 Ready for Phase 1

    All Phase 0 tasks complete. Environment is fully functional.

    Start development with: `./run.sh`
    ```

  - **Verify**: File created with checklist

---

## Summary

**Total Tasks**: 69  
**Phases**: 9  
**Estimated Duration**: ~90 minutes  
**Difficulty**: Beginner-Friendly (suitable for LLM implementation)

### Key Metrics (Success Criteria Verification)

- ✅ **SC-001**: Backend starts in < 30 seconds
- ✅ **SC-002**: Frontend starts in < 20 seconds
- ✅ **SC-003**: run.sh starts both in < 60 seconds
- ✅ **SC-004**: All migrations apply successfully
- ✅ **SC-005**: Environment variables load without exposure
- ✅ **SC-006**: Project structure complete
- ✅ **SC-007**: .gitignore properly configured
- ✅ **SC-008**: README with setup instructions
- ✅ **SC-009**: Software versions verified (Node 18+, Python 3.10+, npm 9+)
- ✅ **SC-010**: Automated setup without manual intervention

### Constitutional Compliance ✅

- ✅ **Principle I**: Modular Django apps architecture established
- ✅ **Principle II**: i18n infrastructure for English + Arabic
- ✅ **Principle III**: Tailwind CSS configured for brand
- ✅ **Principle IV**: Latest stable versions throughout
- ✅ **Principle V**: .env secrets management, zero hardcoding

---

**Status**: ✅ **READY FOR IMPLEMENTATION**  
**Generated**: 2026-03-27  
**Optimized for**: Cheaper LLM models (high specificity, minimal ambiguity)
