## 🚨 OpenRouter API Key Issue - Troubleshooting Guide

**Problem:** Getting 401 "User not found" error from OpenRouter API

**Current Status:** ❌ API Key validation failed

---

## Quick Fixes

### Option 1: Verify Your API Key (Recommended)

1. Go to https://openrouter.ai/dashboard/keys
2. Check if you have an active API key
3. If the key shows as "inactive" or "revoked", create a new one:
   - Click "Create New Key"
   - Copy the full key (starting with `sk-or-v1-`)
   - **Make sure you copy the ENTIRE key without spaces**

4. Update your `.env` file:

   ```
   OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_KEY_HERE
   ```

5. Restart the backend server

---

### Option 2: Check Account Setup

- [ ] OpenRouter account is active and not suspended
- [ ] You've added payment method or have free credits
- [ ] API access is enabled in settings
- [ ] No IP restrictions blocking localhost

---

### Option 3: Test with curl

Replace `YOUR_API_KEY` and run:

```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nvidia/nemotron-3-super-120b-a12b:free",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

- If you get 200 ✅ → Key is valid
- If you get 401 ❌ → Key issue
- If you get 500 → OpenRouter service issue

---

## What I've Fixed

✅ Removed duplicate API key entries from `.env`
✅ Added better error logging in backend
✅ Improved header configuration

---

## Current Error Log

When you send a message, the backend logs show:

```
ERROR    OpenRouter API returned 401: {"error":{"message":"User not found.","code":401}}
```

This specifically means OpenRouter can't find a user associated with your API key.

---

## Next Steps

1. **Verify your API key** by visiting https://openrouter.ai/dashboard/keys
2. **Get a new API key** if the current one is invalid
3. **Update `.env`** with the correct key
4. **Restart the backend** server
5. **Try sending a message** to test

---

## Alternative: Use Mock Mode for Testing

If you want to test the UI without making real API calls, temporarily use:

**In `backend/chats/router.py`, line 30:**

```python
USE_MOCK_RESPONSES = True  # Set to True for testing
```

This will return mock responses from the models for demo purposes.

---

## Support Resources

- OpenRouter Documentation: https://openrouter.ai/docs/
- API Key Setup: https://openrouter.ai/dashboard/keys
- Status: https://openrouter.io/status

---

**Once you update the API key and restart the server, messages should send successfully! 🚀**
