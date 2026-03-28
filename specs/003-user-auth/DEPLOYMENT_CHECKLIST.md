# Deployment Checklist for Authentication Feature

## Pre-Deployment Verification

### Django Configuration (Backend)

- [ ] **DEBUG = False** in production settings
  - Verify: `python manage.py check --deploy`
  - Error messages should not expose sensitive info

- [ ] **SECRET_KEY is strong and unique**
  - Generate new key: `python manage.py shell -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
  - Store in env vars, never hardcode

- [ ] **ALLOWED_HOSTS configured correctly**
  - Set to production domain(s)
  - Example: `['yourdomain.com', 'www.yourdomain.com']`
  - Verify no wildcards unless intentional

- [ ] **HTTPS enabled (SECURE_SSL_REDIRECT = True)**
  - Verify SSL certificate is valid
  - Test: `https://yourdomain.com` loads without warnings

- [ ] **CORS_ALLOWED_ORIGINS set correctly**
  - Must include your frontend domain
  - Should NOT be '\*' in production
  - Example: `['https://yourdomain.com']`

- [ ] **AUTH_COOKIE_SECURE = True** (production only)
  - Cookies only sent over HTTPS
  - Required for production

### Email Service

- [ ] **Email backend configured and tested**
  - EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD set
  - Test sending email: `python manage.py shell`
    ```python
    from django.core.mail import send_mail
    send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])
    ```

- [ ] **Email verified from production email account**
  - Check spam folder for test email
  - Response time < 2 minutes acceptable

- [ ] **Email templates render correctly in both EN and AR**
  - Verify code is visible
  - Verify 10-minute TTL mentioned
  - Verify links work

### Google OAuth

- [ ] **GOOGLE_OAUTH_CLIENT_ID and CLIENT_SECRET set in env**
  - From Google Cloud Console
  - Never hardcoded

- [ ] **Redirect URI matches Google Cloud Console**
  - Development: `http://localhost:3000/auth/callback`
  - Production: `https://yourdomain.com/auth/callback`
  - Verify exact match

- [ ] **Google OAuth tested end-to-end**
  - Click "Sign in with Google" button
  - Complete OAuth flow
  - Account created or merged
  - Redirected to /chat

### Database & Migrations

- [ ] **All migrations applied**
  - `python manage.py migrate`
  - Zero migrations pending
  - Verify: `python manage.py showmigrations | grep '\[ \]'` (should be empty)

- [ ] **Database backups configured**
  - Automated daily backups
  - Backups tested (can restore)
  - Backup retention: ≥ 7 days

- [ ] **Database indexed properly**
  - VerificationCode has indexes on (user, code) and expires_at
  - User has indexes on email
  - Query performance acceptable

### Rate Limiting & Caching

- [ ] **Rate limiting configured**
  - Login: 5 per 15 minutes per IP
  - Code requests: 3 per 60 minutes per email
  - Test: 6 login attempts fail with 429

- [ ] **Cache backend configured**
  - Development: In-memory cache acceptable
  - Production: Redis or Memcached recommended
  - Test: Rate limit working correctly

### Testing

- [ ] **All backend tests pass**

  ```bash
  python manage.py test users --no-input
  Coverage: >90%
  Command: coverage run --source='users' manage.py test users && coverage report
  ```

- [ ] **All frontend tests pass**

  ```bash
  npm run test -- --watchAll=false
  ```

- [ ] **All E2E tests pass**

  ```bash
  npm run test:e2e
  ```

- [ ] **Performance acceptable**
  - Login endpoint: < 200ms p95
  - /me endpoint: < 100ms p95
  - Token refresh: < 50ms p95
  - Monitor for slowness

### Security

- [ ] **Passwords hashed with bcrypt**
  - Verify: `python manage.py shell`
    ```python
    from django.contrib.auth.models import User
    u = User.objects.create_user('test@example.com', password='TestPass123!')
    print(u.password)  # Should start with 'bcrypt$' or similar
    ```

- [ ] **No hardcoded secrets in codebase**
  - Secret key, OAuth credentials, email passwords all in env
  - Scan codebase: `grep -r "password\|secret\|token" --include="*.py" backend/`

- [ ] **CSRF protection enabled**
  - CSRF_COOKIE_HTTPONLY = True
  - CSRF_COOKIE_SECURE = True (production)

- [ ] **SQL injection prevention verified**
  - Using Django ORM (not raw SQL)
  - Parameterized queries for any raw SQL
  - Test: Try SQL injection in login form

- [ ] **XSS protection verified**
  - Template auto-escaping enabled
  - React auto-escapes by default
  - Test: No HTML/JS in error messages

- [ ] **HTTPS/TLS configured**
  - Valid SSL certificate
  - No mixed content warnings
  - HSTS header set (production)
  - Certificate auto-renewal configured

- [ ] **Rate limiting tested for DDoS prevention**
  - 5 login attempts per 15min enforced
  - 3 code requests per hour enforced

### Monitoring & Logging

- [ ] **Error tracking configured (Sentry)**
  - SENTRY_DSN set in env
  - Test error reaches Sentry
  - Alerts configured for critical errors

- [ ] **Logging configured**
  - Log level: INFO or WARNING
  - Logs stored with > 7 day retention
  - No sensitive data in logs (passwords, tokens)

- [ ] **Monitoring alerts set up**
  - High rate of 401 errors → suspicious activity
  - High rate of 429 errors → DDoS or rate limit issue
  - Database connection failures
  - Email service failures

### Documentation

- [ ] **AUTH_IMPLEMENTATION.md completed** (Backend)
  - API endpoint reference
  - Authentication flows documented
  - Troubleshooting guide

- [ ] **AUTH_IMPLEMENTATION.md completed** (Frontend)
  - Hook reference
  - Component documentation
  - Error handling guide

- [ ] **.env.example files updated**
  - `backend/.env.example` with all required vars
  - `frontend/.env.example` with all required vars

- [ ] **README updated**
  - Deployment instructions
  - Environment variable guide
  - Running tests
  - Known issues / limitations

- [ ] **Migration rollback documentation**
  - How to rollback authentication schema
  - Prerequisites for rollback
  - Tested rollback procedure

### Frontend Build & Deployment

- [ ] **Frontend build succeeds**

  ```bash
  npm run build
  # Check build/ directory created with bundle.js, etc.
  ```

- [ ] **Frontend environment variables configured**
  - REACT_APP_API_BASE_URL points to production backend
  - REACT_APP_GOOGLE_CLIENT_ID correct
  - Build contains: npm run build

- [ ] **Frontend tests pass in CI/CD**
  - npm run test passes
  - npm run test:e2e passes

- [ ] **No console errors/warnings in production**
  - Check browser DevTools
  - Fix any deprecation warnings
  - Fix any security warnings (CSP violations)

### Deployment Process

- [ ] **Deployment script prepared**
  - Backup database before deploy
  - Run migrations: `python manage.py migrate`
  - Collect static files: `python manage.py collectstatic --no-input`
  - Restart application server

- [ ] **Zero-downtime deployment planned**
  - Load balancer configured
  - Blue-green or rolling deployment
  - Health checks in place

- [ ] **Rollback procedure documented**
  - Can quickly revert to previous version
  - Database rollback tested
  - Communication plan if needed

### Post-Deployment Verification

- [ ] **Smoke test completed**
  - Signup → Verify Email → Login flow works
  - Forgot Password → Reset → Login works
  - Google OAuth flow works
  - Multi-tab logout works
  - Cookies set correctly (HttpOnly, Secure, SameSite)
  - Email arrives < 2 minutes
  - Rate limiting working (6th login fails)

- [ ] **Production monitoring active**
  - Error tracking (Sentry) receiving events
  - Log aggregation working
  - Performance metrics visible

- [ ] **User communication**
  - Deployment announcement sent (if needed)
  - Known issues communicated
  - Support contact info provided

---

## Deployment Commands (Production)

```bash
# 1. Backup database
pg_dump -h localhost -U postgres chatbot_db > /backups/chatbot_db_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull latest code
git pull origin main

# 3. Install dependencies (if changed)
pip install -r requirements.txt
npm install

# 4. Run migrations
python manage.py migrate

# 5. Build frontend
npm run build

# 6. Collect static files
python manage.py collectstatic --no-input

# 7. Restart application server
systemctl restart gunicorn
systemctl restart nginx

# 8. Verify deployment
curl https://yourdomain.com/api/auth/me/  # Should be 401 (not authenticated)
```

## Rollback Plan (if needed)

```bash
# 1. Stop application
systemctl stop gunicorn

# 2. Revert code
git revert HEAD

# 3. Rollback database
psql -h localhost -U postgres chatbot_db < /backups/chatbot_db_YYYYMMDD_HHMMSS.sql

# 4. Restart application
systemctl start gunicorn

# 5. Verify
curl https://yourdomain.com/api/auth/me/
```

---

## Deployment Sign-Off

- [ ] Tech Lead: Reviewed deployment checklist ****\_\_**** Date: **\_**
- [ ] QA: Smoke test passed ****\_\_**** Date: **\_**
- [ ] DevOps: Infrastructure ready ****\_\_**** Date: **\_**
- [ ] Product: Authorization to deploy ****\_\_**** Date: **\_**

**Deployed to Production by**: ******\_\_\_\_****** **Date**: ****\_\_****

**Deployment Time**: ****\_\_**** (minutes)

**Notes**: ******************************************\_\_\_\_******************************************
