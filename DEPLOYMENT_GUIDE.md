# Deployment Guide: Multi-Language User Profiles Feature

This guide captures the required steps to deploy the multi-language summaries feature across environments.

## 1. Pre-Deployment Checklist

- [ ] All migrations created and committed (UserSummary + language_tag fields)
- [ ] `pytest` suite passes (backend + integration tests)
- [ ] Frontend build succeeds (`npm run build`)
- [ ] Rate limiter tested locally (429 responses verified)
- [ ] `.env` secrets present on server (OpenRouter, Groq keys)
- [ ] Celery/worker process configured for summary generation (if using async tasks)

## 2. Backend Deployment Steps

1. **Install Dependencies**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Apply Database Migrations**

   ```bash
   python manage.py migrate
   ```

3. **Collect Static Files**

   ```bash
   python manage.py collectstatic --noinput
   ```

4. **Restart Services**

   ```bash
   supervisorctl restart nexus-backend
   supervisorctl restart nexus-celery  # if applicable
   ```

5. **Verify Health**
   ```bash
   curl https://<host>/health/
   ```

## 3. Frontend Deployment Steps

1. **Install Dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Build**

   ```bash
   npm run build
   ```

3. **Deploy Bundle**
   - Upload `frontend/build` to CDN or hosting provider
   - Invalidate cache to ensure new assets served

## 4. Configuration Notes

- Ensure `common.middleware.language_context` and `common.middleware.rate_limiter` are registered in `config/settings.py`.
- Configure Django cache backend (Redis recommended) for rate limiter accuracy.
- Set `USE_MOCK_RESPONSES=False` in `chats/router.py` when real AI providers are reachable.
- Background summary generation requires either Celery beat or cron calling `python manage.py generate_summaries`.

## 5. Verification Tests (Post-Deploy)

1. Login and switch language preference to Arabic; UI should flip to RTL.
2. Send messages exceeding 100/minute to confirm 429 responses include localized text.
3. Chat in both languages and ensure `/api/chat/history` filters correctly.
4. After 5+ messages, verify new summary appears on profile page in the correct language.
5. Run smoke tests:
   ```bash
   cd backend && pytest ai/tests/test_views.py
   pytest chats/tests/test_chat_history_api.py
   ```

## 6. Rollback Plan

- Re-deploy previous build artifacts.
- Roll back database migrations: `python manage.py migrate ai <previous_migration>`.
- Disable new middleware entries if they cause issues.

## 7. Monitoring

- Track rate limit hits (429 count) via logs/metrics.
- Monitor Celery worker queues for stuck summary tasks.
- Watch frontend error reporting (Sentry/console).
