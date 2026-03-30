# Data Model: Phase 0 — Environment Setup

**Date**: 2026-03-27  
**Status**: Phase 0 initial structures  
**Database**: SQLite (development)

---

## Summary

Phase 0 establishes the foundational database schema that all subsequent phases will build upon. This data model focuses on:

- **Django project initialization**: Creates default tables (users, permissions, sessions)
- **App scaffolding**: Defines models structure for Phase 1 implementation
- **Migrations framework**: Establishes Django migration pipeline for schema versioning

The complete domain models (User profiles, Chat sessions, Messages, AI configurations) are deferred to Phase 1. Phase 0 creates only the infrastructure to support them.

---

## Phase 0 Schema

### Django System Tables (Automatic)

**auth_user** — Django built-in user model

- `id` (PK)
- `username` (unique)
- `email`
- `password_hash`
- `is_active`, `is_staff`, `is_superuser`
- `date_joined`, `last_login`

**auth_permission** — Permission definitions

- `id` (PK)
- `codename`
- `content_type_id` (FK)

**django_session** — Session storage

- `session_key` (PK)
- `session_data`
- `expire_date`

### App Model Stubs (Created in Phase 0, Implemented in Phase 1)

**users_profile** — User additional profile data

- `id` (PK)
- `user_id` (FK → auth_user)
- `bio` (text) — AI-generated summary
- `language_preference` (enum: en, ar)
- `created_at`, `updated_at`

**chats_chatsession** — Chat session container

- `id` (PK)
- `user_id` (FK → auth_user)
- `title` (text) — Auto-generated from first message
- `ai_model` (string) — Default model selection
- `created_at`, `updated_at`

**chats_message** — Individual messages

- `id` (PK)
- `session_id` (FK → chats_chatsession)
- `role` (enum: user, assistant) — Message sender
- `content` (text) — Message body
- `ai_model` (string, nullable) — Model that responded
- `created_at`

**ai_model** — Available AI models

- `id` (PK)
- `name` (string, unique) — e.g., "gpt-4", "claude-3"
- `provider` (string) — e.g., "openrouter", "groq", "together"
- `is_active` (boolean)

**summaries_usersummary** — AI-generated user profiles

- `id` (PK)
- `user_id` (FK → auth_user, unique)
- `summary` (text) — Generated summary
- `generated_at`
- `last_updated`

---

## Migration Strategy

### Phase 0 Migrations

**Migration 0001**: Create Django default tables

- Automatically created by `python manage.py makemigrations`
- Run via: `python manage.py migrate`
- Executed in run.sh automatically

**Migration 0002**: Create app models (users, chats, ai, summaries)

- Generated when models.py files are created in Phase 0 (empty stubs)
- Run via run.sh automatically
- Actual model implementation deferred to Phase 1

### Migration Execution (run.sh)

run.sh handles migrations automatically:

```bash
# Check if migrations are pending
python manage.py migrate --check  # Exits 0 if no pending, 1 if pending

# Apply pending migrations (idempotent)
if [ $? -ne 0 ]; then
  python manage.py migrate  # Creates/updates schema
fi
```

This approach ensures:

- Fresh clones: All migrations applied on first run
- Subsequent runs: No migration delay (idempotent check)
- Developers: No manual migration commands required
- Testing: Consistent initial state for tests

---

## Django Apps Structure

### users/models.py (Phase 0 stub)

```python
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    language_preference = models.CharField(
        max_length=2,
        choices=[('en', 'English'), ('ar', 'Arabic')],
        default='en'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### chats/models.py (Phase 0 stub)

```python
from django.db import models
from django.contrib.auth.models import User

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    ai_model = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Message(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    ai_model = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### ai/models.py (Phase 0 stub)

```python
from django.db import models

class AIModel(models.Model):
    name = models.CharField(max_length=50, unique=True)
    provider = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
```

### summaries/models.py (Phase 0 stub)

```python
from django.db import models
from django.contrib.auth.models import User

class UserSummary(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    summary = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
```

---

## Environment Variables (Phase 0)

### .env Template

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite, auto-created)
DATABASE_URL=sqlite:///db.sqlite3

# JWT Secret (Phase 1)
JWT_SECRET=your-jwt-secret-here-change-in-production

# AI APIs (Phase 1)
OPENROUTER_API_KEY=
GROQ_API_KEY=
TOGETHER_API_KEY=

# Default Model Selection (Phase 1)
DEFAULT_MODEL=Nemotron

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Backend Loading (phase 0)

```python
# settings.py
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-not-for-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000'
).split(',')
```

---

## Phase 1 Extensions (Not Phase 0)

The following data structures will be added in Phase 1:

- **Authentication**: JWT token storage, refresh token tables
- **User Preferences**: Model selection history, theme preferences
- **Chat Metadata**: Tags, pinned messages, search indexes
- **AI Configurations**: Model parameters, rate limiting rules
- **Audit Logs**: User actions, API calls, error tracking

---

## Integrity Rules

### Phase 0 Constraints

- Users must exist (auth_user) before profiles can be created
- Chat sessions require a user (referential integrity)
- Messages require a chat session
- No data is pre-populated in Phase 0 (tables are empty)

### Data Isolation (Constitution Principle V)

- User data is completely isolated (user_id FK prevents cross-user access)
- Sessions are user-specific
- Messages belong to user's sessions only
- Summaries are one-per-user

---

## Testing Support

### Fixture Data (for Phase 0 tests)

```python
# tests/fixtures.py
from django.contrib.auth.models import User
from users.models import Profile

def create_test_user():
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    Profile.objects.create(
        user=user,
        language_preference='en'
    )
    return user
```

### Migration Testing

- Verify migrations apply cleanly
- Confirm schema matches model definitions
- Test migration rollback

---

## Status

✅ **Phase 0 Complete**: Database schema initialized via Django migrations  
⏳ **Phase 1 Pending**: Full model implementation with serializers and views  
⏳ **Phase 2 Pending**: API endpoints and feature implementation

**Next**: Proceed to contracts/ directory for API design.
