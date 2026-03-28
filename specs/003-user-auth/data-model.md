# Phase 1: Data Model — Authentication & Authorization

**Date**: March 28, 2026 | **Feature**: User Authentication & Authorization  
**Status**: Design Complete | **Input**: Phase 0 Research

## Entity Relationship Diagram

```
┌─────────────────────────┐
│         User            │
├─────────────────────────┤
│ id (PK)                 │
│ username (unique)       │ ← Django native
│ email (unique)          │ ← Django native
│ password_hash           │ ← Django native (bcrypt)
│ first_name              │
│ last_name               │
│ is_active               │
│ is_superuser            │
│ is_staff                │
│ date_joined             │
│ last_login              │
│ auth_provider           │ ← NEW (email/google)
│ profile_picture_url     │ ← NEW (Google URL or null)
│ language_preference     │ ← Existing (Profile FK)
│ is_verified             │ ← NEW (email verified)
└─────────────────────────┘
        │
        │ (1:1)
        │
┌─────────────────────────┐
│ Profile (Existing)      │
├─────────────────────────┤
│ id (PK)                 │
│ user_id (FK)            │
│ bio                     │
│ language_preference     │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌──────────────────────────────┐
│ VerificationCode (NEW)       │
├──────────────────────────────┤
│ id (PK)                      │
│ user_id (FK)                 │
│ code (6-digit string)        │ ← Email code
│ type (verify/reset)          │ ← Mark purpose
│ expires_at (DateTime)        │ ← 10 min TTL
│ created_at (DateTime)        │ ← Auto-set
│ is_used (Boolean)            │ ← Invalidate after use
└──────────────────────────────┘
        │
        │ (N:1)
        │
        └── User


┌──────────────────────────────┐
│ AuthToken (OPTIONAL)         │
├──────────────────────────────┤
│ id (PK)                      │
│ user_id (FK)                 │
│ token_jti (unique)           │ ← JWT JTI claim
│ token_type (access/refresh)  │
│ blacklisted_at (DateTime)    │ ← null=valid
│ expires_at (DateTime)        │
├──────────────────────────────┤
│ Note: Optional model for     │
│ JWT blacklist (future phase) │
└──────────────────────────────┘
```

---

## Detailed Model Definitions

### 1. User Model (Extended Django Auth User)

**Table**: `auth_user`

| Field                   | Type            | Constraints                           | Notes                  |
| ----------------------- | --------------- | ------------------------------------- | ---------------------- |
| id                      | AutoField (PK)  | PRIMARY KEY                           | Django default         |
| username                | CharField(150)  | UNIQUE, NOT NULL                      | Email as username      |
| email                   | EmailField(254) | UNIQUE, NOT NULL                      | User's email           |
| password                | CharField(128)  | NOT NULL                              | Hash via bcrypt        |
| first_name              | CharField(150)  | NULL                                  | From Google or signup  |
| last_name               | CharField(150)  | NULL                                  | From Google or signup  |
| is_active               | BooleanField    | DEFAULT True                          | Can login              |
| is_superuser            | BooleanField    | DEFAULT False                         | Admin privileges       |
| is_staff                | BooleanField    | DEFAULT False                         | Staff portal           |
| date_joined             | DateTimeField   | DEFAULT now                           | Registration timestamp |
| last_login              | DateTimeField   | NULL                                  | Last session           |
| **auth_provider**       | CharField(10)   | CHOICES(email, google), DEFAULT email | NEW: Signup method     |
| **profile_picture_url** | URLField        | NULL, BLANK                           | NEW: Google picture    |
| **is_verified**         | BooleanField    | DEFAULT False                         | NEW: Email verified    |

**Indexes**:

- `username` (UNIQUE)
- `email` (UNIQUE)
- `is_verified` (common in queries)

**Migration**:

```python
# users/migrations/0002_user_auth_fields.py
class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]
    operations = [
        migrations.AddField(
            model_name='user',
            name='auth_provider',
            field=models.CharField(max_length=10, choices=[('email', 'Email'), ('google', 'Google')], default='email'),
        ),
        migrations.AddField(
            model_name='user',
            name='profile_picture_url',
            field=models.URLField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='is_verified',
            field=models.BooleanField(default=False),
        ),
    ]
```

### 2. VerificationCode Model (NEW)

**Table**: `users_verificationcode`

| Field      | Type             | Constraints                      | Notes                |
| ---------- | ---------------- | -------------------------------- | -------------------- |
| id         | UUID             | PRIMARY KEY                      | Unique identifier    |
| user_id    | ForeignKey(User) | NOT NULL, FK → auth_user         | Reference to user    |
| code       | CharField(6)     | NOT NULL                         | 6-digit code         |
| type       | CharField(10)    | CHOICES(verify, reset), NOT NULL | Purpose              |
| expires_at | DateTimeField    | NOT NULL                         | 10 min from creation |
| created_at | DateTimeField    | DEFAULT now, NOT NULL            | Timestamp            |
| is_used    | BooleanField     | DEFAULT False                    | Invalidate after use |

**Indexes**:

- `(user_id, type)` (UNIQUE) — Only one active code per user per type
- `expires_at` (for cleanup queries)
- `code` (rapid lookup)

**Constraints**:

- `CHECK is_used OR expires_at > now` — Active codes must not be expired
- `UNIQUE (user_id, type, is_used=False)` — Only one active code per (user, type)

**Model Definition**:

```python
# users/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import random
import string

class VerificationCode(models.Model):
    TYPE_CHOICES = [
        ('verify', 'Email Verification'),
        ('reset', 'Password Reset'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'users_verificationcode'
        indexes = [
            models.Index(fields=['user', 'type']),
            models.Index(fields=['expires_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'type'],
                condition=models.Q(is_used=False),
                name='unique_active_code'
            ),
        ]

    @classmethod
    def create_code(cls, user, code_type):
        """Generate and save a new verification code"""
        # Invalidate previous codes
        cls.objects.filter(user=user, type=code_type, is_used=False).update(is_used=True)

        # Generate 6-digit code
        code = str(random.randint(100000, 999999))

        # Create with 10-min expiration
        instance = cls.objects.create(
            user=user,
            code=code,
            type=code_type,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        return instance

    def is_valid(self):
        """Check if code is valid (not used, not expired)"""
        return not self.is_used and self.expires_at > timezone.now()

    def __str__(self):
        return f"{self.user.email} ({self.type})"
```

### 3. Profile Model (Existing, Extended)

**Table**: `users_profile`

| Field               | Type                | Notes                   |
| ------------------- | ------------------- | ----------------------- |
| id                  | AutoField (PK)      | Django default          |
| user_id             | OneToOneField(User) | Reference to user       |
| bio                 | TextField           | Optional bio            |
| language_preference | CharField(2)        | en/ar, synced with User |
| created_at          | DateTimeField       | Profile creation        |
| updated_at          | DateTimeField       | Last update             |

**No changes required** — existing Profile model works. User's language preference stored here.

### 4. AuthToken Model (OPTIONAL — Not Phase 3)

For future JWT blacklisting (logout with instant revocation):

```python
class AuthToken(models.Model):
    TOKEN_TYPES = [
        ('access', 'Access Token'),
        ('refresh', 'Refresh Token'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token_jti = models.CharField(max_length=500, unique=True)  # JWT claim ID
    token_type = models.CharField(max_length=10, choices=TOKEN_TYPES)
    blacklisted_at = models.DateTimeField(null=True, blank=True)  # null = valid
    expires_at = models.DateTimeField()

    def is_valid(self):
        return not self.blacklisted_at and self.expires_at > timezone.now()
```

**Not required** for Phase 3 (logout via cookie deletion sufficient). Can add in Phase 4.

---

## Database Relationships

### User-to-ChatSession (Existing)

Each User can have many ChatSessions:

```
User (1) ──→ (N) ChatSession
```

✅ Already implemented in Phase 1; no auth changes needed.

### User-to-VerificationCode (NEW)

Each User can have multiple VerificationCodes (one per type):

```
User (1) ──→ (N) VerificationCode
```

Why multiple? User can request code for "verify_email" and separately trigger "password_reset"; both active until used or expired.

### User-to-Profile (Existing 1:1)

```
User (1) ──→ (1) Profile
```

Language preference stored in Profile; synced when user changes language.

---

## Validation Rules

### User Model Validations

1. **email**: Must be valid email format, unique, lowercased

   ```python
   def clean(self):
       if User.objects.filter(email__iexact=self.email).exclude(id=self.id).exists():
           raise ValidationError("Email already registered")
   ```

2. **password**: Minimum 8 characters, cannot be common password

   ```python
   from django.contrib.auth.password_validation import validate_password

   try:
       validate_password(password, user=user)
   except ValidationError as e:
       raise
   ```

3. **auth_provider**: Must be one of enum values (checked by Django)

4. **profile_picture_url**: Valid HTTPS URL (null allowed)

   ```python
   def clean(self):
       if self.profile_picture_url and not self.profile_picture_url.startswith('https://'):
           raise ValidationError("Profile picture must be HTTPS URL")
   ```

5. **is_verified**: Automatically set to True when user completes email verification

### VerificationCode Validations

1. **code**: Exactly 6 digits

   ```python
   def clean(self):
       if not self.code.isdigit() or len(self.code) != 6:
           raise ValidationError("Code must be 6 digits")
   ```

2. **type**: Must be in TYPE_CHOICES

3. **expires_at**: Must be in future (auto-set to now + 10min)

4. **Uniqueness**: Only one active (is_used=False) code per user per type

---

## Data Constraints & Cleanup

### Cleanup Tasks

**Automatic expiration**:

```python
# management/commands/cleanup_expired_codes.py
def handle(self, *args, **options):
    expired_count = VerificationCode.objects.filter(
        expires_at__lt=timezone.now(),
        is_used=False
    ).delete()[0]
    self.stdout.write(f"Deleted {expired_count} expired codes")
```

Run via periodic task (Celery beat) or cron:

```bash
# In Docker/systemd
*/15 * * * * python manage.py cleanup_expired_codes
```

### Cascade Behaviors

- **User deleted** → VerificationCode cascade deleted (user removed)
- **VerificationCode deleted** → User not affected (code cleanup)

---

## Migration Path

### Phase 3 (This Phase)

1. Create VerificationCode model
2. Add auth_provider, profile_picture_url, is_verified fields to User
3. Run migrations: `python manage.py migrate users`

### Phase 4+ (Future)

1. Add AuthToken model for JWT blacklist (optional)
2. Add phone_number field to User (2FA)
3. Add last_login_provider to Profile (audit)

---

## Summary

**New Tables**:

- `users_verificationcode` — Stores email verification/reset codes

**Modified Tables**:

- `auth_user` — +3 fields (auth_provider, profile_picture_url, is_verified)

**Unchanged Tables**:

- `users_profile` — Existing; no changes
- `chats_chatsession` — User FK already exists; no changes
- `chats_message` — No changes

**Relationships**:

- User → VerificationCode (1:N, cascade)
- User → Profile (1:1, cascade — existing)
- User → ChatSession (1:N, cascade — existing)

→ **Phase 1 Data Model Complete** ✅
