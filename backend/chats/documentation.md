# Chat System API Documentation

## Base URL

```
http://localhost:8000/api/chat/
```

## Authentication

All endpoints require JWT authentication via Bearer token in Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Create New Chat Session

**POST** `/api/chat/`

Creates a new chat session for the authenticated user.

**Request Body:**

```json
{
  "title": "Python Help",
  "model": "deepseek",
  "language": "en"
}
```

_Note: All fields are optional. `title` defaults to empty, `model` defaults to 'deepseek', `language` defaults to 'en'_

**Response (201 Created):**

```json
{
  "id": 123,
  "title": "Chat 001",
  "model": "deepseek",
  "language": "en",
  "created_at": "2026-03-29T10:00:00Z",
  "updated_at": "2026-03-29T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid model or language
- `401 Unauthorized`: Missing/invalid token
- `500 Internal Server Error`: Server error

---

### 2. List All User Sessions

**GET** `/api/chat/?page=1`

Retrieves paginated list of user's chat sessions, sorted by most recent.

**Query Parameters:**

- `page` (optional): Page number, defaults to 1

**Response (200 OK):**

```json
{
  "sessions": [
    {
      "id": 123,
      "title": "Chat 001",
      "model": "deepseek",
      "created_at": "2026-03-29T10:00:00Z",
      "updated_at": "2026-03-29T10:00:00Z",
      "message_count": 5
    }
  ],
  "page": 1,
  "total_pages": 1,
  "total_count": 1
}
```

**Error Responses:**

- `401 Unauthorized`: Missing/invalid token
- `500 Internal Server Error`: Server error

---

### 3. Get Session with Paginated Messages

**GET** `/api/chat/{id}/?page=1`

Retrieves a specific session with its messages, paginated.

**Path Parameters:**

- `id` (required): Session ID

**Query Parameters:**

- `page` (optional): Page number, defaults to 1

**Response (200 OK):**

```json
{
  "session_id": 123,
  "messages": [
    {
      "id": 456,
      "role": "user",
      "content": "What is Python?",
      "model": "deepseek",
      "created_at": "2026-03-29T10:00:00Z"
    },
    {
      "id": 457,
      "role": "assistant",
      "content": "Python is a programming language...",
      "model": "deepseek",
      "created_at": "2026-03-29T10:00:05Z"
    }
  ],
  "page": 1,
  "total_pages": 2,
  "total_count": 50,
  "page_size": 50
}
```

**Error Responses:**

- `400 Bad Request`: Invalid page number
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: User doesn't own this session
- `404 Not Found`: Session not found
- `500 Internal Server Error`: Server error

---

### 4. Send Message to AI

**POST** `/api/chat/{id}/send/`

Sends a message to the selected AI model and receives response.

**Path Parameters:**

- `id` (required): Session ID

**Request Body:**

```json
{
  "message": "What is machine learning?",
  "model": "llama3"
}
```

_Note: `message` is required (max 5000 chars). `model` is optional and uses session model if not provided_

**Response (200 OK):**

```json
{
  "user_message_id": 456,
  "ai_message_id": 457,
  "response": "Machine learning is...",
  "model": "llama3",
  "tokens_used": 187,
  "session_updated_at": "2026-03-29T10:00:05Z"
}
```

**Error Responses:**

- `400 Bad Request`: Empty message, message too long, invalid model
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: User doesn't own this session
- `404 Not Found`: Session not found
- `503 Service Unavailable`: AI provider error

---

### 5. Update Session AI Model

**PUT** `/api/chat/{id}/update_model/`

Changes the AI model for a session (affects future messages only).

**Path Parameters:**

- `id` (required): Session ID

**Request Body:**

```json
{
  "model": "mistral"
}
```

_Note: `model` is required and must be one of: deepseek, llama3, mistral_

**Response (200 OK):**

```json
{
  "session_id": 123,
  "model": "mistral",
  "updated_at": "2026-03-29T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid model
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: User doesn't own this session
- `404 Not Found`: Session not found

---

### 6. Delete Chat Session

**DELETE** `/api/chat/{id}/`

Permanently deletes a session and all its messages.

**Path Parameters:**

- `id` (required): Session ID

**Response (200 OK):**

```json
{
  "status": "deleted",
  "session_id": 123,
  "session_title": "Chat 001",
  "messages_deleted": 10
}
```

**Error Responses:**

- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: User doesn't own this session
- `404 Not Found`: Session not found

---

## Validation Rules

### Messages

- **Maximum length**: 5,000 characters
- **Minimum length**: 1 character (non-whitespace)

### Models

Valid values: `deepseek`, `llama3`, `mistral`

### Languages

Valid values: `en`, `ar`

---

## Rate Limiting

- Per-user: 100 requests per minute
- Per-IP: 1000 requests per minute

---

## Common cURL Examples

### Create a session

```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quick Chat",
    "model": "deepseek"
  }'
```

### Send a message

```bash
curl -X POST http://localhost:8000/api/chat/123/send/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what can you do?",
    "model": "deepseek"
  }'
```

### Get messages from session

```bash
curl http://localhost:8000/api/chat/123/?page=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete a session

```bash
curl -X DELETE http://localhost:8000/api/chat/123/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Status Codes Reference

- `200 OK`: Successful GET/PUT
- `201 Created`: Successful POST (session creation)
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: External service error (AI provider)

---

## WebSocket Real-Time Updates

When connected to WebSocket (`ws://localhost:8000/ws/chat/`), clients receive real-time message updates:

```json
{
  "type": "message_received",
  "session_id": 123,
  "message": {
    "id": 457,
    "role": "assistant",
    "content": "AI response here",
    "model": "deepseek",
    "created_at": "2026-03-29T10:00:05Z"
  }
}
```

---

## Performance Targets

- Create session: < 1 second
- Send message: < 15 seconds (including AI response)
- Load session (500+ messages): < 2 seconds (first page)
- List sessions: < 500ms
