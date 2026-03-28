# Database Rollback Guide - Authentication Feature

## Overview

This guide covers how to rollback the authentication feature if issues occur in production. The rollback strategy depends on:

1. **What needs to be rolled back** (code vs data)
2. **How critical the issue** (immediate rollback vs gradual)
3. **Data integrity requirements** (preserve user data vs restore to pre-auth state)

---

## Pre-Rollback Checklist

- [ ] Issue documented with date/time
- [ ] Error logs collected and saved
- [ ] Database backup taken (automatic)
- [ ] Communication plan initiated (notify stakeholders)
- [ ] Rollback authorization obtained from Tech Lead
- [ ] Rollback testing completed in staging (if not emergency)

---

## Scenario 1: Code Rollback (Issue in business logic)

**Use When**: Bug in signup/login/email flow, incorrect validation, wrong error messages

**Time Impact**: 5-10 minutes downtime if rolling back live

### Step 1: Identify Previous Good Version

```bash
# List recent commits
git log --oneline -20

# Example:
# a1b2c3d (HEAD) Fix: Fix OAuth redirect issue
# d4e5f6g Add: Google OAuth implementation
# h7i8j9k Fix: Email verification with RTL
# k0l1m2n Add: Email verification feature
```

### Step 2: Create Rollback Tag

```bash
# Tag current problematic version for reference
git tag rollback-failure-date-$(date +%Y%m%d-%H%M%S)
git push origin rollback-failure-date-*
```

### Step 3: Revert Code

**Option A: Revert single commit (if bug is isolated)**

```bash
# Find the commit ID that introduced the bug
git revert <commit-id>

# Example:
git revert a1b2c3d

# This creates a new commit that undoes a1b2c3d
git push origin main
```

**Option B: Go back to previous stable version (if multiple commits affected)**

```bash
# Find the stable version
git checkout <stable-commit-id>

# Create a new branch
git checkout -b hotfix/rollback-$(date +%Y%m%d)

# Push hotfix branch
git push origin hotfix/rollback-*

# Merge to main
git checkout main
git merge hotfix/rollback-*
git push origin main
```

### Step 4: Clear Cache (if applicable)

```bash
# Redis cache
redis-cli FLUSHDB

# Python cache
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Django cache
python manage.py shell -c "from django.core.cache import cache; cache.clear()"
```

### Step 5: Restart Application

```bash
# Systemd
systemctl restart gunicorn
systemctl restart nginx

# Docker
docker restart chatbot-backend
docker restart chatbot-frontend

# Verify
curl https://yourdomain.com/api/auth/login  # Should respond (401 if not authenticated)
```

### Step 6: Smoke Test

- [ ] Signup works
- [ ] Login works
- [ ] Email verification works
- [ ] Password reset works
- [ ] Google OAuth works

---

## Scenario 2: Database Rollback (Data corruption or schema issues)

**Use When**: Migration introduced bugs, data corruption detected, schema needs reverting

**Time Impact**: 15-30 minutes downtime

**WARNING**: Rolling back database will lose any new user data created after backup

### Step 1: Identify Corrupted Data

```bash
# Check for obvious issues
python manage.py shell

# List recent migrations
python manage.py showmigrations users

# Example output:
# users
# [X] 0001_initial
# [X] 0002_add_verification_code
# [X] 0003_add_oauth_provider  (← This one might be problematic)
# [X] 0004_add_rate_limiting
```

### Step 2: Get Latest Backup

```bash
# List backups (assuming nightly backups)
ls -lh /backups/

# Example:
# total 245M
# -rw-r--r-- 1 postgres postgres 122M Jan 15 23:00 chatbot_db_20250115_230000.sql
# -rw-r--r-- 1 postgres postgres 120M Jan 14 23:00 chatbot_db_20250114_230000.sql
# -rw-r--r-- 1 postgres postgres 115M Jan 13 23:00 chatbot_db_20250113_230000.sql

# Choose appropriate backup
BACKUP_FILE="/backups/chatbot_db_20250114_230000.sql"
```

### Step 3: Stop Application (Prevent new requests)

```bash
# Stop web server to prevent new requests
systemctl stop gunicorn
systemctl stop nginx

# Or for Docker:
docker stop chatbot-backend
docker stop chatbot-frontend

echo "Application stopped at $(date)"
```

### Step 4: Create New Backup (Before rollback!)

```bash
# Create backup of current corrupted state
CORRUPTION_BACKUP="/backups/chatbot_db_corrupted_$(date +%Y%m%d_%H%M%S).sql"

pg_dump -h localhost -U postgres chatbot_db > $CORRUPTION_BACKUP

# Compress to save space
gzip $CORRUPTION_BACKUP

echo "Corrupted state backed up to: $CORRUPTION_BACKUP.gz"
```

### Step 5: Drop and Restore Database

```bash
# Connect to PostgreSQL as admin
psql -h localhost -U postgres

# Inside psql:
# Drop all connections to the database
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE datname = 'chatbot_db' AND pid <> pg_backend_pid();

# Drop the database
DROP DATABASE IF EXISTS chatbot_db;

# Create fresh database
CREATE DATABASE chatbot_db OWNER postgres;

# Exit psql
\q
```

### Step 6: Restore from Backup

```bash
# Restore the backup
psql -h localhost -U postgres chatbot_db < /backups/chatbot_db_20250114_230000.sql

# Wait for restore to complete (show progress)
# For large databases this may take 5-30 minutes depending on size

echo "Database restore completed at $(date)"
```

### Step 7: Verify Restore

```bash
# Connect and verify
python manage.py dbshell

# Inside database shell:
SELECT COUNT(*) FROM auth_user;  # Should show users from backup time
SELECT COUNT(*) FROM users_verificationcode;  # Should show codes
SELECT * FROM auth_user ORDER BY date_joined DESC LIMIT 1;  # Check latest user

# Exit
\q

# Check Django sees the same
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.count()
>>> User.objects.latest('date_joined').email
```

### Step 8: Revert Code to Matching Version

**Important**: Ensure code version matches backup database version!

```bash
# If backup is from specific commit
backup_date="2025-01-14"

# Find commit from that date
git log --after="${backup_date}T00:00:00" --until="${backup_date}T23:59:59" --oneline

# Example: Find commit before schema change
git checkout <commit-before-breaking-migration>

# Or if you know the tag
git checkout v1.2.3
```

### Step 9: Restart Application

```bash
# Application restart
systemctl start gunicorn
systemctl start nginx

# Verify logs for errors
journalctl -u gunicorn -n 50
journalctl -u nginx -n 50

# Or Docker
docker start chatbot-backend
docker start chatbot-frontend
docker logs -f chatbot-backend
```

### Step 10: Full Smoke Test

```bash
# Test key flows
curl -X POST https://yourdomain.com/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","full_name":"Test User"}'

curl https://yourdomain.com/api/auth/login/
curl https://yourdomain.com/api/auth/me/
curl https://yourdomain.com/api/auth/logout/
```

---

## Scenario 3: Partial Rollback (Keep code, fix data)

**Use When**: Data inconsistency, but code is fine

### Approach A: Data Repair Script

```python
# Create: backend/scripts/repair_auth_data.py

from django.contrib.auth.models import User
from users.models import VerificationCode
from datetime import timedelta

def repair_expired_codes():
    """Remove expired verification codes"""
    expired = VerificationCode.objects.filter(
        expires_at__lt=timezone.now()
    )
    count = expired.delete()[0]
    print(f"Deleted {count} expired codes")

def repair_duplicate_users():
    """Identify users with duplicate emails (should not happen)"""
    from django.db.models import Count

    duplicates = User.objects.values('email').annotate(
        count=Count('email')
    ).filter(count__gt=1)

    for dup in duplicates:
        users = User.objects.filter(email=dup['email']).order_by('date_joined')
        print(f"Email {dup['email']} has {dup['count']} users")
        # Merge users or delete duplicates as appropriate

def repair_oauth_conflicts():
    """Check for OAuth ID conflicts"""
    from users.models import OAuthConnection

    # Find accounts merged incorrectly
    connections = OAuthConnection.objects.values('provider', 'provider_id').annotate(
        count=Count('id')
    ).filter(count__gt=1)

    for conn in connections:
        print(f"OAuth {conn['provider']}:{conn['provider_id']} linked {conn['count']} times")

if __name__ == '__main__':
    repair_expired_codes()
    repair_duplicate_users()
    repair_oauth_conflicts()
    print("Repair completed")
```

```bash
# Run repair
python manage.py shell < backend/scripts/repair_auth_data.py
```

### Approach B: Manual Data Queries

```python
# In Django shell: python manage.py shell

# Find problematic data
from django.contrib.auth.models import User
from users.models import VerificationCode

# Users without email (should not happen)
User.objects.filter(email='').count()

# Verification codes stuck in pending
VerificationCode.objects.filter(is_used=False, expires_at__lt=timezone.now()).count()

# Delete expired codes
from django.utils import timezone
VerificationCode.objects.filter(expires_at__lt=timezone.now(), is_used=False).delete()

# Clear cache
from django.core.cache import cache
cache.clear()
```

---

## Scenario 4: Authentication Feature Only Rollback (Keep database, remove auth)

**Use When**: Want to disable authentication but keep existing infrastructure

**Requires**: New database migration to rollback schema

### Step 1: Create Rollback Migration

```python
# backend/users/migrations/0099_rollback_authentication.py

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0098_latest_migration'),
    ]

    operations = [
        # These MUST be run in reverse order they were created
        migrations.RemoveModel(name='VerificationCode'),
        migrations.RemoveModel(name='OAuthConnection'),
        migrations.RemoveField(model_name='user', name='is_email_verified'),
        migrations.RemoveField(model_name='user', name='oauth_provider'),
        migrations.RemoveField(model_name='user', name='oauth_id'),
    ]
```

### Step 2: Run Rollback Migration

```bash
# Test in development first
python manage.py migrate users 0098_latest_migration

# Then in production (with approval)
python manage.py migrate users 0099_rollback_authentication

# Verify rollback
python manage.py showmigrations users
```

---

## Post-Rollback Procedures

### 1. Incident Report

Create `INCIDENT_REPORT_<date>.md`:

```markdown
# Incident Report - Auth Feature Issue

**Date**: 2025-01-15
**Time Started**: 14:30 UTC
**Time Resolved**: 14:50 UTC
**Duration**: 20 minutes

## Issue Description

[What went wrong]

## Root Cause

[Why it happened]

## Resolution

[What was done to fix]

## Users Affected

[Number of users, data loss estimate]

## Preventive Measures

[How to prevent similar issues]

## Follow-up Actions

- [ ] Code review of rollback changes
- [ ] Add test case to prevent regression
- [ ] Update monitoring alerts
- [ ] Communication to users (if needed)
```

### 2. Data Reconciliation

```bash
# Compare restored data with current state
# Identify any user-created data lost
# Calculate impact

SELECT COUNT(*) FROM auth_user;
SELECT COUNT(*) FROM users_verificationcode;
SELECT MAX(date_joined) FROM auth_user;
```

### 3. Communication

- [ ] Notify stakeholders (Tech Lead, Product, Support)
- [ ] Update status page if applicable
- [ ] Send user communication (if necessary)
- [ ] Schedule post-incident review (PSR)

### 4. Redeployment

Once issue is fixed:

```bash
# After code fix
git commit -am "Fix: Address authentication issue"
git push origin main

# Follow normal deployment process
# See: DEPLOYMENT_CHECKLIST.md
```

---

## Testing Rollback Procedures

**IMPORTANT**: Test rollback procedures in STAGING before relying on them in production!

### Annual Rollback Drill

```bash
#!/bin/bash
# Run annually to verify rollback procedures still work

echo "=== Testing Database Rollback Procedure ==="

# 1. Create test backup
pg_dump -h localhost -U postgres chatbot_db > /tmp/test_backup_$(date +%s).sql

# 2. Create test data
python manage.py shell -c "
from django.contrib.auth.models import User
User.objects.create_user('rollback-test@example.com', password='TestPass123!')
print('Test user created')
"

# 3. Simulate corruption
# (Actually, we'll just restore and verify)

# 4. Restore
postgres -U postgres < /tmp/test_backup_*.sql

# 5. Verify
python manage.py shell -c "
from django.contrib.auth.models import User
print(f'Users: {User.objects.count()}')"

# 6. Cleanup
rm /tmp/test_backup_*.sql

echo "=== Rollback Drill Complete ==="
```

---

## Contacts & Escalation

- **On-Call Engineer**: [Contact Info]
- **Tech Lead**: [Contact Info]
- **Database Administrator**: [Contact Info]
- **DevOps Lead**: [Contact Info]

---

## References

- Django Migrations: https://docs.djangoproject.com/en/5.0/topics/migrations/
- PostgreSQL Backup/Restore: https://www.postgresql.org/docs/current/backup.html
- Git Revert: https://git-scm.com/docs/git-revert
- DEPLOYMENT_CHECKLIST.md (this project)
