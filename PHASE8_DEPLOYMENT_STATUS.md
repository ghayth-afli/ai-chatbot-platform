# Phase 8 Deployment Status — 005-multilang-summaries

**Date**: 2026-03-30  
**Branch**: `005-multilang-summaries`  
**Status**: ✅ Ready for staging push (ops actions pending)

## Overview

- Backend signal/task chain for automatic summaries is live; management command + service-layer tests pass (35/35).
- Documentation (deployment guide, API reference, frontend README) reflects the final implementation; checklist updated in `IMPLEMENTATION_CHECKLIST.md`.
- The only remaining effort is the operational push + staging smoke detailed below.

## Verification Snapshot

| Check                | Result                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted unit suite  | `cd backend && pytest ai/tests/test_services.py` → **PASS** (35 tests)                                                                        |
| Integration coverage | `tests/integration/test_us1_view_summaries.py`, `test_us2_chat_language.py`, `test_us4_auto_summary.py` — last full run (Phase 8 QA) **PASS** |
| Security / load      | `tests/security/test_rate_limiting.py`, `tests/performance/test_load.py` — previously executed during T060–T062                               |
| Docs                 | `DEPLOYMENT_GUIDE.md`, `backend/API_DOCUMENTATION.md`, `frontend/README.md` updated for latest flows                                          |

> **Note**: `python manage.py showmigrations` currently raises `ModuleNotFoundError: reportlab` because `backend/chats/services.py` imports `reportlab`. Install `reportlab` (or guard the import) before re-running the command in staging/prod environments.

## Pending Operational Steps

1. **Push code**
   - Ensure working tree is clean (resolve local untracked files as needed).
   - `git push origin 005-multilang-summaries`
2. **Apply migrations on staging**
   - `cd backend && python manage.py migrate`
3. **Seed/verify async summary worker**
   - Ensure whichever scheduler (Celery/APScheduler) invokes `summarize_completed_sessions` is running.
4. **Backfill summaries if needed**
   - `python manage.py generate_summaries --verbose --limit 25`
5. **Restart services**
   - Reload ASGI/Gunicorn + any worker processes.
6. **Run staging smoke** (EN + AR accounts)
   - GET `/api/users/{id}/profile/summary`
   - PATCH `/api/users/{id}/language-preference`
   - POST `/api/chat/send` (verify `language_tag`)
   - GET `/api/chat/history?language_filter=ar`
   - Exceed chat send 100 req/min to confirm 429 + localized error
7. **Monitor**
   - Tail logs for rate-limit spikes, summary-task errors, and translation regressions for at least 30 minutes.

## Rollback Reminders

- Rollback plan and checklist live in `DEPLOYMENT_GUIDE.md`.
- Database backups should be captured prior to running migrations; the previous `db.sqlite3.backup.*` artifacts remain as reference.

## Known Follow-ups

- Install `reportlab` before running `python manage.py showmigrations` (or wrap the optional import).
- Once staging smoke passes, update `PROJECT_STATUS.md` / `STATUS.md` to reflect Phase 8 completion.
