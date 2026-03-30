# API Contract: Chat Language Tagging & Multi-Language Response Endpoint

**Feature**: Multi-Language User Profiles with AI-Generated Summaries  
**Version**: 1.0  
**Date**: March 30, 2026  
**Stability**: Draft

## Endpoint: POST /api/chat/send (Extended)

### Purpose

Send a chat message and receive an AI response in the user's preferred language. Language is automatically attached to the message and response.

### Request

**Method**: `POST`  
**Path**: `/api/chat/send`  
**Authentication**: Required (JWT token)

**Request Body** (JSON):

```json
{
  "session_id": "sess-123",
  "message": "What is machine learning?",
  "model": "gpt-4",
  "language": "en" // Optional; defaults to user.language_preference
}
```

**Headers**:

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept-Language: en-US  // Optional hint; final language from user profile
```

**Parameters**:
| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `session_id` | string | Yes | Chat session identifier |
| `message` | string | Yes | User message text |
| `model` | string | Yes | AI model selection (e.g., `gpt-4`, `claude-3`, `groq-llama`) |
| `language` | string | No | Explicit language override (`'en'` or `'ar'`); ignored if different from user.language_preference |

### Response

**Status Code**: `200 OK`

**Response Body** (JSON):

```json
{
  "session_id": "sess-123",
  "message_id": "msg-456",
  "user_message": "What is machine learning?",
  "user_message_language_tag": "en",
  "ai_response": "Machine learning is a field of artificial intelligence that focuses on...",
  "ai_response_language_tag": "en",
  "model": "gpt-4",
  "created_at": "2026-03-30T15:30:00Z",
  "tokens_used": {
    "prompt": 42,
    "completion": 128,
    "total": 170
  }
}
```

**For Arabic User** (`user.language_preference == 'ar'`):

```json
{
  "session_id": "sess-123",
  "message_id": "msg-456",
  "user_message": "ما هو التعلم الآلي؟",
  "user_message_language_tag": "ar",
  "ai_response": "التعلم الآلي هو مجال من مجالات الذكاء الاصطناعي يركز على...",
  "ai_response_language_tag": "ar",
  "model": "gpt-4",
  "created_at": "2026-03-30T15:30:00Z",
  "tokens_used": {
    "prompt": 42,
    "completion": 128,
    "total": 170
  }
}
```

**Key Guarantees**:

- `ai_response_language_tag` always matches `user_message_language_tag` (and user.language_preference)
- For Arabic users: response uses Formal Modern Standard Arabic (MSA), no colloquialisms, RTL-compatible
- Both message and response tagged with the same language code

### Error Responses

**400 Bad Request** - Invalid message or session

For English user:

```json
{
  "detail": "Message cannot be empty.",
  "error_code": "EMPTY_MESSAGE"
}
```

For Arabic user:

```json
{
  "detail": "لا يمكن أن تكون الرسالة فارغة.",
  "error_code": "EMPTY_MESSAGE"
}
```

**401 Unauthorized** - Missing JWT or invalid user  
**429 Too Many Requests** - Rate limit exceeded (see Rate Limiting section below)  
**503 Service Unavailable** - AI API unreachable

---

## Endpoint: GET /api/chat/history/{session_id} (Extended)

### Purpose

Retrieve chat history for a session. All messages include language_tag metadata.

### Request

**Method**: `GET`  
**Path**: `/api/chat/history/{session_id}`  
**Query Parameters**:

| Parameter         | Type    | Required | Default | Description                                             |
| ----------------- | ------- | -------- | ------- | ------------------------------------------------------- |
| `language_filter` | string  | No       | None    | Filter by language (`'en'` or `'ar'`); omit to show all |
| `limit`           | integer | No       | 50      | Number of messages to return                            |

### Response

**Status Code**: `200 OK`

```json
{
  "session_id": "sess-123",
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": "ما هي الشبكات العصبية؟",
      "language_tag": "ar",
      "created_at": "2026-03-30T14:00:00Z"
    },
    {
      "id": "msg-002",
      "role": "assistant",
      "content": "الشبكات العصبية هي بنية حسابية مستوحاة من...",
      "language_tag": "ar",
      "model": "gpt-4",
      "created_at": "2026-03-30T14:00:05Z"
    },
    {
      "id": "msg-003",
      "role": "user",
      "content": "Tell me more about training",
      "language_tag": "en",
      "created_at": "2026-03-30T14:05:00Z"
    }
  ],
  "count": 3
}
```

**Behavior**:

- Messages display in chronological order (oldest first)
- `language_tag` indicates the language of that message
- If `language_filter=ar`, only Arabic messages returned
- If user switches language mid-session, new messages tagged with new language

---

## Data Contract: Chat Message with Language Tag

```typescript
interface ChatMessage {
  id: string; // Unique message identifier
  session_id: string; // Parent session
  role: "user" | "assistant"; // Message sender
  content: string; // Message text
  language_tag: "en" | "ar"; // ISO 639-1 language code (NEW)
  model?: string; // AI model (for assistant messages)
  created_at: ISO8601; // Timestamp
  tokens_used?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

interface ChatSession {
  id: string;
  user_id: number;
  language_tag: "en" | "ar"; // Session's primary language (NEW)
  message_count: number; // Total messages (NEW; triggers summary at 5+)
  created_at: ISO8601;
  updated_at: ISO8601;
}
```

---

## Prompt Template for AI Model

When calling external AI APIs (OpenRouter, Groq, Together), the backend constructs the prompt with language-specific instructions:

### For English Users

```
You are a helpful AI assistant. Respond clearly and concisely in English.
User question: {user_message}
```

### For Arabic Users

```
أنت مساعد ذكاء اصطناعي مفيد. رد بصيغة فصحى (Modern Standard Arabic) بشكل واضح وموجز.
تجنب الجمل العامية والكنايات غير الشائعة.
سؤال المستخدم: {user_message}
```

**Invariants**:

- Always include language instruction in prompt
- Always request Formal Modern Standard Arabic (MSA) for Arabic users
- Never mix Arabic and English in a single response
- Response language matches request language

---

## Language Tagging Rules

### Assignment Rules

1. **At message creation**: Language tag = `user.language_preference` from JWT context
2. **At session creation**: Language tag = `user.language_preference` (immutable for the session)
3. **Language switches mid-session**: Prior messages retain original tag; new messages tagged with new preference

### Example: User Switches Language Mid-Session

```
Session Language Tag: 'en' (set at session creation)

msg-1: "What is AI?" → language_tag: 'en'
msg-2: [AI response] → language_tag: 'en'

(User changes preference to Arabic)

msg-3: "ما هو الذكاء الاصطناعي؟" → language_tag: 'ar'
msg-4: [AI response in MSA] → language_tag: 'ar'

(User changes back to English)

msg-5: "Tell me more" → language_tag: 'en'
msg-6: [AI response] → language_tag: 'en'
```

**Query for "Arabic Conversations"**: `ChatMessage.objects.filter(session__user=user, language_tag='ar')`

---

## Localization for Error Messages

### 1. Empty Message Error

**English**:

```json
{
  "detail": "Message cannot be empty.",
  "error_code": "EMPTY_MESSAGE"
}
```

**Arabic (MSA)**:

```json
{
  "detail": "لا يمكن أن تكون الرسالة فارغة.",
  "error_code": "EMPTY_MESSAGE"
}
```

### 2. Invalid Session Error

**English**:

```json
{
  "detail": "Session not found.",
  "error_code": "SESSION_NOT_FOUND"
}
```

**Arabic**:

```json
{
  "detail": "لم يتم العثور على الجلسة.",
  "error_code": "SESSION_NOT_FOUND"
}
```

### 3. AI Service Unavailable

**English**:

```json
{
  "detail": "AI service is temporarily unavailable. Please try again in a few moments.",
  "error_code": "AI_SERVICE_UNAVAILABLE"
}
```

**Arabic**:

```json
{
  "detail": "خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة مرة أخرى خلال قليل.",
  "error_code": "AI_SERVICE_UNAVAILABLE"
}
```

---

## Performance SLAs

| Metric                                | Target                   |
| ------------------------------------- | ------------------------ |
| Message send + AI response round-trip | <5 seconds p99           |
| Chat history retrieval (50 messages)  | <1 second p99            |
| Language tag retrieval (middleware)   | <50ms impact per request |

---

## Rate Limiting

This endpoint is subject to the platform's rate limit: **100 requests per minute per user**, applied uniformly across all account types (human users, bots, service accounts).

On limit exceeded:

**429 Too Many Requests**

English:

```json
{
  "detail": "Request rate limit exceeded: 100 requests per minute. Please retry after 60 seconds.",
  "retry_after": 60,
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```

Arabic:

```json
{
  "detail": "تم تجاوز حد معدل الطلب: 100 طلب في الدقيقة. يرجى إعادة المحاولة بعد 60 ثانية.",
  "retry_after": 60,
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```

---

## Testing Checklist

- [ ] English user sends message → response in English with language_tag='en'
- [ ] Arabic user sends message → response in Formal MSA with language_tag='ar'
- [ ] User switches language mid-session → new messages tagged correctly, old ones retain original tag
- [ ] GET history with language_filter returns only filtered messages
- [ ] Rate limit enforcement returns 429 on 100+ req/min
- [ ] Error messages localized per user language
- [ ] RTL characters preserved in Arabic responses
- [ ] Colloquialism-free MSA verified in sample responses
- [ ] Concurrent requests from different languages don't interfere
