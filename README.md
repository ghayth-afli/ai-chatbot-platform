<div align="center">

# 🤖 nexus AI

### Multi-Model Chatbot Platform

_Experience the future of AI conversation in English and Arabic_

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Django](https://img.shields.io/badge/Django-5.0-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-80%2B%20Passing-success.svg)](#testing)

**[Features](#-features)** • **[Quick Start](#-quick-start)** • **[Documentation](PROJECT_DOCUMENTATION.md)** • **[API Docs](#-api-reference)** • **[Contributing](#-contributing)**

</div>

---

## 📖 Overview

**nexus AI** is a production-ready, multi-model chatbot platform that seamlessly integrates multiple AI models (Nemotron, LLaMA, Trinity) with full bilingual support (English & Arabic). Built with modern web technologies and AI-assisted development, nexus provides a robust foundation for intelligent conversational applications.

### Why nexus AI?

- 🌍 **True Bilingual Support**: Full English and Arabic UI with automatic RTL layout
- 🤖 **Multi-Model Intelligence**: Switch between Nemotron, Liquid, and Trinity 7B in real-time
- ⚡ **Real-time Chat**: WebSocket-based messaging for instant responses
- 🔐 **Enterprise Security**: JWT authentication, email verification
- 🎨 **Modern UX**: Responsive design with glass morphism and smooth animations
- ♿ **Accessible**: WCAG 2.1 Level AA compliant
- 🧪 **Well-Tested**: 80+ comprehensive test cases (unit, integration, E2E)
- 📚 **Complete Documentation**: Extensive docs for developers and users
- 🚀 **One-Command Setup**: Get started in seconds with `./run.sh`

> **Built with AI**: This project was developed with assistance from **GitHub Copilot** and **Claude Sonnet 4.5**, showcasing AI-assisted development best practices.

## ✨ Features

### 🎯 Core Features

- **Multi-Model AI Chat**: Interact with Nemotron, Liquid, and Trinity 7B in one interface
- **Real-time Messaging**: WebSocket-based chat with instant AI responses
- **Bilingual Interface**: Full English and Arabic support with automatic RTL layout switching
- **Smart Chat History**: Persistent conversations with session management and filtering
- **Model Switching**: Seamlessly switch between AI models mid-conversation
- **AI-Generated Summaries**: Automatic conversation summaries for quick insights

### 🔐 Authentication & Security

- **JWT Authentication**: Secure token-based authentication
- **Email Verification**: 6-digit code verification system
- **Google OAuth**: One-click sign-in with Google
- **Password Reset**: Secure password recovery flow
- **Rate Limiting**: Protect against abuse with intelligent rate limiting

### 🎨 User Experience

- **Responsive Design**: Optimized for mobile (360px), tablet (768px), and desktop (1440px+)
- **Modern UI**: Glass morphism, neon accents, and smooth animations
- **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
- **RTL Support**: Perfect right-to-left layout for Arabic

### 🧪 Quality Assurance

- **80+ Test Cases**: Comprehensive unit, integration, and E2E tests
- **Playwright E2E**: Automated browser testing
- **Jest Unit Tests**: Component and hook testing
- **Pytest Backend Tests**: API and business logic testing

---

## 🚀 Quick Start

Get nexus AI running in **3 simple steps**:

### Step 1: Clone & Configure

```bash
# Clone the repository
git clone <repository-url>
cd ai-chatbot-platform

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

**Required API Keys**:

- **OpenRouter API**: Get your key at [openrouter.ai](https://openrouter.ai)

### Step 2: Auto-Setup (First Time Only)

```bash
# Analyze your environment (read-only check)
./run.sh --analyze

# Fix any issues and install dependencies
./run.sh --fix
```

This will:

- ✅ Create Python virtual environment
- ✅ Install all Python dependencies
- ✅ Run Django migrations
- ✅ Install frontend npm packages
- ✅ Verify configuration

### Step 3: Launch

```bash
# Start the application
./run.sh
```

**🎉 That's it!** Your app is now running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000/api

### Additional Commands

```bash
# Check application status
./run.sh --status

# Re-analyze environment after updates
./run.sh --analyze

# Stop all services
# Press Ctrl+C in the terminal running ./run.sh
```

---

## 📋 Prerequisites

Before getting started, ensure you have:

| Tool        | Required Version          | Check Command       |
| ----------- | ------------------------- | ------------------- |
| **Node.js** | 18.x or higher            | `node --version`    |
| **npm**     | 9.x or higher             | `npm --version`     |
| **Python**  | 3.11 or higher            | `python3 --version` |
| **Git**     | Latest                    | `git --version`     |
| **Bash**    | Latest (WSL2 for Windows) | `bash --version`    |

### Installation Guides

<details>
<summary><b>🖥️ Windows Users</b></summary>

Install WSL2 (Windows Subsystem for Linux):

```bash
wsl --install
```

Then install Ubuntu from Microsoft Store and follow Linux instructions.

</details>

<details>
<summary><b>🍎 macOS Users</b></summary>

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Python
brew install python@3.11
```

</details>

<details>
<summary><b>🐧 Linux Users</b></summary>

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3.11 python3.11-venv nodejs npm git

# Fedora
sudo dnf install python3.11 nodejs npm git
```

</details>

---

## 🔧 Manual Setup

If you prefer more control or the automated script doesn't work:

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Unix/macOS:
source venv/bin/activate
# On Windows (WSL):
source venv/bin/activate
# On Windows (CMD):
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend server
# Option 1: Django development server (no WebSocket)
python manage.py runserver

# Option 2: Daphne ASGI server (with WebSocket support) - RECOMMENDED
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

### Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The React app will automatically open at http://localhost:3000

---

## 📁 Project Structure

```
ai-chatbot-platform/
│
├── 📂 backend/                    # Django REST Framework Backend
│   ├── 📂 api/                    # Health check endpoints
│   ├── 📂 users/                  # User authentication & management
│   ├── 📂 chats/                  # Chat sessions, messages, WebSocket
│   ├── 📂 ai/                     # AI provider integration & routing
│   ├── 📂 summaries/              # Conversation summaries
│   ├── 📂 common/                 # Shared utilities & middleware
│   ├── 📂 config/                 # Django settings & configuration
│   ├── 📄 requirements.txt        # Python dependencies
│   └── 📄 manage.py               # Django management script
│
├── 📂 frontend/                   # React Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/        # Reusable UI components
│   │   │   ├── landing/         # Landing page sections
│   │   │   └── chat/            # Chat interface components
│   │   ├── 📂 pages/             # Page components (Landing, Chat, etc.)
│   │   ├── 📂 hooks/             # Custom React hooks
│   │   ├── 📂 i18n/              # Internationalization (EN/AR)
│   │   ├── 📂 services/          # API service layer
│   │   └── 📂 utils/             # Utility functions
│   ├── 📂 tests/e2e/             # Playwright E2E tests
│   ├── 📄 package.json           # Node dependencies
│   └── 📄 tailwind.config.js     # Tailwind CSS config
│
├── 📄 .env                        # Environment variables (git-ignored)
├── 📄 .env.example                # Environment template
├── 📄 run.sh                      # One-command startup script
├── 📄 README.md                   # This file
└── 📄 PROJECT_DOCUMENTATION.md    # Complete documentation
```

---

## 🛠️ Technology Stack

<table>
<tr>
<td valign="top" width="50%">

### Backend

- **Framework**: Django 5.0.2
- **API**: Django REST Framework 3.14
- **WebSocket**: Django Channels 4.0
- **Server**: Daphne (ASGI)
- **Auth**: JWT (Simple JWT 5.5)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **AI APIs**: OpenRouter
- **Testing**: pytest, pytest-django

</td>
<td valign="top" width="50%">

### Frontend

- **Framework**: React 18.2
- **Routing**: React Router 6.21
- **Styling**: Tailwind CSS 3.4
- **i18n**: i18next 23.7
- **HTTP**: Axios 1.6
- **WebSocket**: Socket.io Client 4.5
- **Markdown**: react-markdown 9.1
- **Testing**: Jest, Playwright, React Testing Library

</td>
</tr>
</table>

---

## 🌐 Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Django Settings
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
DATABASE_URL=sqlite:///db.sqlite3

# JWT Authentication
JWT_SECRET=your-jwt-secret-key

# AI API Keys (REQUIRED)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here

# Default AI Model
DEFAULT_MODEL=Nemotron

# CORS (Frontend URLs)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend API Configuration
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
```

### Getting API Keys

**OpenRouter API**: Sign up at [openrouter.ai](https://openrouter.ai) and generate an API key

---

## 📚 API Reference

### Base URL

```
http://127.0.0.1:8000/api
```

### Key Endpoints

<details>
<summary><b>🔐 Authentication</b></summary>

```bash
# Register new user
POST /api/auth/signup/
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "language_preference": "en"
}

# Verify email
POST /api/auth/verify-email/
{
  "email": "john@example.com",
  "code": "123456"
}

# Login
POST /api/auth/login/
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Get current user
GET /api/auth/me/
Headers: Authorization: Bearer <access_token>

# Logout
POST /api/auth/logout/
Headers: Authorization: Bearer <access_token>
```

</details>

<details>
<summary><b>💬 Chat Operations</b></summary>

```bash
# Create chat session
POST /api/chat/
Headers: Authorization: Bearer <access_token>
{
  "title": "My Chat Session",
  "model": "Nemotron"
}

# List chat sessions
GET /api/chat/
Headers: Authorization: Bearer <access_token>

# Get session with messages
GET /api/chat/session/{session_id}/
Headers: Authorization: Bearer <access_token>

# Send message
POST /api/chat/{session_id}/send/
Headers:
  Authorization: Bearer <access_token>
  Accept-Language: en
{
  "message": "What is machine learning?",
  "model": "Nemotron"
}

# Delete session
DELETE /api/chat/{session_id}/
Headers: Authorization: Bearer <access_token>

# Get chat history (with language filter)
GET /api/chat/history/?language_filter=en
Headers: Authorization: Bearer <access_token>
```

</details>

<details>
<summary><b>🤖 AI Operations</b></summary>

```bash
# Get profile summaries
GET /api/ai/users/{user_id}/profile/summary?language_filter=en
Headers: Authorization: Bearer <access_token>

# Update language preference
PATCH /api/ai/users/{user_id}/language-preference
Headers: Authorization: Bearer <access_token>
{
  "language_preference": "ar"
}
```

</details>

**📖 Full API documentation**: See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md#api-documentation)

---

## 🧪 Testing

### Run All Tests

```bash
# Backend tests (pytest)
cd backend
source venv/bin/activate
pytest                      # Run all tests
pytest -v                   # Verbose output
pytest --cov=.             # With coverage report

# Frontend unit tests (Jest)
cd frontend
npm test                    # Interactive mode
npm test -- --coverage     # With coverage

# E2E tests (Playwright)
cd frontend
npm run test:e2e           # Headless mode
npm run test:e2e:ui        # Interactive UI
npm run test:e2e:headed    # See browser
npm run test:e2e:debug     # Debug mode
```

### Test Coverage

- ✅ **Backend**: 30+ unit tests + 6 integration tests
- ✅ **Frontend**: 22+ component tests + 25+ E2E scenarios
- ✅ **Total**: 80+ comprehensive test cases
- ✅ **Coverage**: Authentication, Chat, AI routing, i18n, Accessibility

---

## 🌍 Internationalization (i18n)

nexus AI provides full bilingual support with automatic RTL layout:

### Supported Languages

- 🇬🇧 **English** (LTR) - Default
- 🇸🇦 **Arabic** (RTL) - العربية

### Language Switching

Users can switch languages via:

1. **Landing Page Toggle**: Click EN/عربي in navigation
2. **User Preference**: Saved in database per user
3. **Browser Language**: Auto-detection on first visit

### Adding New Languages

1. Add translation file: `frontend/src/i18n/xx.json`
2. Update config: `frontend/src/i18n/config.js`
3. Add language to `SUPPORTED_LANGUAGES`

**📖 Full i18n guide**: See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md#internationalization-i18n)

---

## 🚢 Deployment

### Production Deployment Guide

For detailed production deployment instructions, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md#deployment).

**Quick Deployment Checklist**:

- [ ] Configure production `.env` with secure keys
- [ ] Set `DEBUG=False` in Django settings
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure Nginx as reverse proxy
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Use Gunicorn/Daphne with Supervisor/systemd
- [ ] Configure CORS for production domain
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure backups
- [ ] Run security checks

```bash
# Production build
cd frontend
npm run build

# Collect static files
cd backend
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**

   ```bash
   git clone https://github.com/yourusername/ai-chatbot-platform.git
   cd ai-chatbot-platform
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Write tests for new features
   - Update documentation as needed

4. **Run tests**

   ```bash
   # Backend
   cd backend && pytest

   # Frontend
   cd frontend && npm test && npm run test:e2e
   ```

5. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Code Style

- **Python**: Follow PEP 8 style guide
- **JavaScript**: Use ESLint configuration
- **React**: Use functional components with hooks
- **CSS**: Use Tailwind utility classes

### Pull Request Guidelines

- Keep PRs focused on a single feature/fix
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Link related issues in PR description

---

## 🐛 Troubleshooting

### Common Issues

<details>
<summary><b>Port already in use (3000 or 8000)</b></summary>

```bash
# Find and kill process on port 3000 (frontend)
# Unix/macOS:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Find and kill process on port 8000 (backend)
# Unix/macOS:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

</details>

<details>
<summary><b>Python virtual environment issues</b></summary>

```bash
# Delete and recreate venv
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

</details>

<details>
<summary><b>Database migration errors</b></summary>

```bash
cd backend
source venv/bin/activate

# Reset all migrations (⚠️ Deletes all data)
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
rm db.sqlite3
python manage.py makemigrations
python manage.py migrate
```

</details>

<details>
<summary><b>npm install fails</b></summary>

```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

</details>

<details>
<summary><b>WebSocket connection fails</b></summary>

- Ensure Daphne is running (not `runserver`)
- Check CORS settings in `backend/config/settings.py`
- Verify JWT token is valid
- Check browser console for errors
</details>

<details>
<summary><b>AI API returns errors</b></summary>

- Verify API keys in `.env` file
- Check API key permissions on provider dashboard
- Ensure you have credits/quota available
- Check network connectivity
</details>

### Getting Help

- **Documentation**: Check [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
- **Issues**: Open a GitHub issue with detailed description
- **Logs**: Check `logs/` directory for error details
- **Status**: Run `./run.sh --status` to check system health

---

## 📖 Documentation

- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)**: Complete project documentation
  - Architecture overview
  - Detailed API reference
  - i18n implementation guide
  - Authentication flow
  - Chat system architecture
  - Testing guide
  - Deployment instructions

---

## 🤖 AI-Assisted Development

This project showcases modern AI-assisted development practices:

### Tools Used

- **GitHub Copilot**: Code generation, testing, documentation
- **Claude Sonnet 4.5**: Architecture design, debugging, complex problem-solving

### Benefits Achieved

- ⚡ **50% faster development**: Reduced time on boilerplate and repetitive tasks
- 🎯 **Better code quality**: Consistent patterns and best practices
- 🧪 **Comprehensive testing**: 80+ test cases generated with AI assistance
- 📚 **Complete documentation**: Detailed docs created efficiently
- 🐛 **Faster debugging**: Quick identification and resolution of issues

### Best Practices

1. **Always review AI-generated code**
2. **Test thoroughly** - AI code needs the same rigor
3. **Security first** - Review for vulnerabilities
4. **Provide context** - Better input = better output
5. **Iterate and refine** - Don't accept first suggestion blindly

**Learn more**: See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md#ai-development-tools-used)

---

## 📊 Project Status

### Current Phase: ✅ Phase 4 Complete

- ✅ **Phase 1**: Environment setup and landing page
- ✅ **Phase 2**: Backend API and authentication
- ✅ **Phase 3**: Chat system and WebSocket
- ✅ **Phase 4**: Multi-language summaries and AI routing
- 🔄 **Phase 5**: Performance optimization (planned)
- 📅 **Phase 6**: Advanced features (planned)

### Metrics

- **Lines of Code**: 3,500+
- **Test Cases**: 80+
- **Test Coverage**: Backend 85%, Frontend 75%
- **Components**: 10+ React components
- **API Endpoints**: 15+
- **Supported Languages**: 2 (English, Arabic)
- **AI Models**: 3 (Nemotron, Liquid, Trinity)

---

## 📝 License

This project is provided for development and evaluation purposes.

See [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-chatbot-platform/issues)
- **Documentation**: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)

---

<div align="center">

### ⭐ Star this project if you find it useful!

**[⬆ Back to Top](#-nexus-ai)**

Made with ❤️ using AI-assisted development

**GitHub Copilot** × **Claude Sonnet 4.5**

</div>
