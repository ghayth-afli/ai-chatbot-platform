## ⚡ Quick Test Guide - OpenRouter Integration

### Quick Verification

Run this to verify everything is working:

```bash
cd backend
python test_openrouter_models.py
```

Expected output:

```
✅ ALL TESTS PASSED!
✨ Your OpenRouter integration is ready with:
  • Nemotron (nvidia/nemotron-3-super-120b-a12b:free)
  • Liquid (liquid/lfm-2.5-1.2b-thinking:free)
  • Trinity (arcee-ai/trinity-mini:free)
```

---

## 🚀 Testing the Chat Interface

### 1. Start Backend

```bash
cd backend
python manage.py runserver
```

### 2. Start Frontend

```bash
cd frontend
npm start
```

### 3. Create a Chat Session

- Go to http://localhost:3000
- Click "New Chat"
- Select a model (🚀 Nemotron, 💧 Liquid, or ✨ Trinity)
- Type a message
- Click Send or press Shift+Enter

### 4. Expected Behavior

- Message sends successfully
- AI responds with the selected model
- Model badge shows correct icon and name
- Can switch models mid-conversation

---

## 🧪 API Test with cURL

Test OpenRouter API directly:

```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: http://localhost:3000" \
  -d '{
    "model": "nvidia/nemotron-3-super-120b-a12b:free",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

## ✅ What to Check

- [ ] Backend starts without errors
- [ ] Frontend loads with new model UI
- [ ] Can create new chat session
- [ ] Can select all 3 models
- [ ] Messages send and receive responses
- [ ] Model icons display correctly (🚀 💧 ✨)
- [ ] Can switch models in existing session
- [ ] Session history loads with correct model

---

## 🔧 Model Details

| Model       | Speed  | Provider | Use Case                         |
| ----------- | ------ | -------- | -------------------------------- |
| 🚀 Nemotron | Medium | NVIDIA   | General purpose, 120B parameters |
| 💧 Liquid   | Fast   | Liquid   | Fast inference, thinking model   |
| ✨ Trinity  | Fast   | Arcee AI | Efficient mini model             |

---

## 📝 Files Changed

**Backend: 7 changes**

- router.py (removed Groq, updated models)
- services.py (valid models list)
- models.py (default model)
- views.py (default model)
- 3 test files

**Frontend: 8 changes**

- 5 component files (models configuration)
- 1 hook file (useChat)
- 1 service file (chatService)
- 1 data file (landing page)
- 1 page component (ChatPage)
- 2 test files

---

## 🎯 Key Improvements

✅ Single provider (OpenRouter)
✅ Simplified routing logic
✅ Consistent error handling
✅ Better performance
✅ Easier maintenance

---

## ❓ Troubleshooting

### Issue: "Model not found" error

- Check that model ID in OPENROUTER_MODELS matches exactly
- Verify API key is correct and has access to free models

### Issue: API returns 401

- Check OPENROUTER_API_KEY in .env file
- Verify it's not expired or revoked

### Issue: Model not appearing in UI

- Clear browser cache (Ctrl+Shift+Delete)
- Refresh page (Ctrl+F5)
- Check console for JavaScript errors

### Issue: Old model still showing

- Database migration may needed
- Clear browser localStorage
- Check database default value was updated

---

## 📞 Support Commands

```bash
# Check API key is loaded
cat backend/.env | grep OPENROUTER_API_KEY

# Run backend tests
python backend/test_openrouter_models.py

# Check frontend builds
cd frontend && npm run build

# Run full test suite
python backend/manage.py test
```

---

**Everything is configured and ready to use!** 🎉
