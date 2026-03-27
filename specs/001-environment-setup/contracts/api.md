# API Contracts: Phase 0 — Environment Setup

**Date**: 2026-03-27  
**Status**: Phase 0 Infrastructure  
**Backend API**: Django REST Framework on http://127.0.0.1:8000

---

## Overview

Phase 0 establishes the API infrastructure and health check endpoints. Full feature endpoints (authentication, chat, etc.) are deferred to Phase 1.

**Phase 0 Endpoints**:

- Health check (verify backend is running)
- API root (browsable API for development)
- Django admin (optional, Phase 1)

**Phase 1+ Endpoints** (not in scope for Phase 0):

- Authentication endpoints
- Chat endpoints
- User profile endpoints
- AI model endpoints

---

## HTTP Status Codes

Standard HTTP status codes used throughout the API:

| Code | Meaning      | Use Case                             |
| ---- | ------------ | ------------------------------------ |
| 200  | OK           | Successful request, data returned    |
| 201  | Created      | Resource created (POST)              |
| 204  | No Content   | Successful request, no data returned |
| 400  | Bad Request  | Invalid request format or parameters |
| 401  | Unauthorized | Authentication required              |
| 403  | Forbidden    | Authenticated but not authorized     |
| 404  | Not Found    | Resource not found                   |
| 500  | Server Error | Unexpected error                     |

---

## Response Format

All API responses follow this format (except health check):

### Success Response (200/201)

```json
{
  "status": "success",
  "data": {
    /* endpoint-specific data */
  },
  "timestamp": "2026-03-27T10:30:00Z"
}
```

### Error Response (4xx/5xx)

```json
{
  "status": "error",
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "timestamp": "2026-03-27T10:30:00Z"
}
```

### List Response

```json
{
  "status": "success",
  "data": [
    {
      /* item 1 */
    },
    {
      /* item 2 */
    }
  ],
  "pagination": {
    "count": 10,
    "next": "/api/endpoint?page=2",
    "previous": null,
    "page_size": 10
  }
}
```

---

## Phase 0 Endpoints

### 1. Health Check Endpoint

**Purpose**: Verify backend is running and database is accessible

**Endpoint**: `GET /api/health/`

**Authentication**: None

**Request**:

```http
GET /api/health/ HTTP/1.1
Host: 127.0.0.1:8000
```

**Response (200 OK)**:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-03-27T10:30:00Z"
}
```

**Response (503 Service Unavailable)**:

```json
{
  "status": "error",
  "message": "Database connection failed",
  "timestamp": "2026-03-27T10:30:00Z"
}
```

**Use Case**: Automated health checks, CI/CD pipelines, monitoring

---

### 2. API Root Endpoint

**Purpose**: Provide browsable API interface and endpoint documentation

**Endpoint**: `GET /api/`

**Authentication**: None (read-only at this stage)

**Request**:

```http
GET /api/ HTTP/1.1
Host: 127.0.0.1:8000
Accept: application/json
```

**Response (200 OK)**:

```json
{
  "health": "http://127.0.0.1:8000/api/health/",
  "users": "http://127.0.0.1:8000/api/users/ (Phase 1+)",
  "chats": "http://127.0.0.1:8000/api/chats/ (Phase 1+)",
  "ai-models": "http://127.0.0.1:8000/api/ai-models/ (Phase 1+)"
}
```

**Use Case**: API discovery, development reference, client initialization

---

## CORS Configuration

**Allowed Origins** (from .env):

- `http://localhost:3000` — React frontend development
- `http://127.0.0.1:3000` — Alternative localhost
- Additional origins in .env via `CORS_ALLOWED_ORIGINS`

**Allowed Methods**:

- `GET` — Read operations
- `POST` — Create operations (Phase 1+)
- `PUT` — Full update operations (Phase 1+)
- `PATCH` — Partial update operations (Phase 1+)
- `DELETE` — Delete operations (Phase 1+)
- `OPTIONS` — CORS preflight

**Allowed Headers**:

- `Content-Type`
- `Authorization` (Phase 1+ for JWT)
- Custom headers as needed

---

## Authentication (Phase 1+)

Phase 0 does not implement authentication. Phase 1 will add:

```
- JWT token-based authentication
- Bearer token in Authorization header
- Token refresh mechanism
- CORS credentials handling
```

Example Phase 1 authenticated request:

```http
GET /api/users/me/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Error Handling

All errors follow this format:

```json
{
  "status": "error",
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {
    // Optional: field-specific details
    "field_name": ["Error 1", "Error 2"]
  }
}
```

### Common Error Codes

| Code               | Description              | Example                            |
| ------------------ | ------------------------ | ---------------------------------- |
| `VALIDATION_ERROR` | Request data is invalid  | Missing required field             |
| `NOT_FOUND`        | Resource doesn't exist   | Chat session not found             |
| `UNAUTHORIZED`     | Authentication required  | No JWT token provided              |
| `FORBIDDEN`        | Insufficient permissions | User accessing another user's data |
| `CONFLICT`         | Resource already exists  | Email already registered           |
| `RATE_LIMIT`       | Too many requests        | Exceeded API rate limit            |
| `SERVER_ERROR`     | Unexpected server error  | Database connection error          |

---

## Rate Limiting

Phase 0 implements basic rate limiting (to be configured):

- **Default**: 1000 requests per hour per IP
- **Per-user** (Phase 1+): 10000 requests per hour per authenticated user

Rate limit information in response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1648405200
```

---

## Pagination (Phase 1+)

List endpoints will support pagination:

**Query Parameters**:

- `page` — Page number (default: 1)
- `page_size` — Items per page (default: 20, max: 100)

**Example**:

```
GET /api/chats/?page=2&page_size=50
```

**Response**:

```json
{
  "status": "success",
  "data": [
    /* 50 items */
  ],
  "pagination": {
    "count": 150,
    "next": "/api/chats/?page=3&page_size=50",
    "previous": "/api/chats/?page=1&page_size=50",
    "page_size": 50
  }
}
```

---

## Filtering & Search (Phase 1+)

List endpoints will support filtering:

**Query Parameters** (examples):

- `search=query` — Full-text search (chats: title, messages: content)
- `language=ar` — Filter by language preference
- `ai_model=gpt-4` — Filter by model
- `created_after=2026-01-01` — Filter by date range

**Example**:

```
GET /api/chats/?search=bug&ai_model=gpt-4&created_after=2026-01-01
```

---

## Versioning

**Current API Version**: `v1` (implicit in URL structure)

Future releases may use:

```
/api/v1/endpoint/   — Version 1
/api/v2/endpoint/   — Version 2
```

---

## Frontend Integration (React)

### Axios Configuration

```javascript
// services/api.js
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests (Phase 1+)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Using API in React Components

```javascript
import api from "../services/api";

// Get health status
const checkHealth = async () => {
  try {
    const response = await api.get("/health/");
    console.log("Backend is healthy:", response.data);
  } catch (error) {
    console.error("Backend error:", error.message);
  }
};
```

---

## Testing API

### Using curl

```bash
# Health check
curl http://127.0.0.1:8000/api/health/

# API root
curl http://127.0.0.1:8000/api/

# With verbose output
curl -v http://127.0.0.1:8000/api/health/
```

### Using Postman

1. Create new request
2. Method: `GET`
3. URL: `http://127.0.0.1:8000/api/health/`
4. Send

### Using React DevTools

```javascript
// In browser console
fetch("http://127.0.0.1:8000/api/health/")
  .then((r) => r.json())
  .then(console.log);
```

---

## Contract Testing

Phase 1 will include contract tests to verify API compliance:

```python
# tests/contract/test_api.py
import pytest
from django.test import Client

def test_health_endpoint_returns_200():
    client = Client()
    response = client.get('/api/health/')
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'
```

---

## Documentation & Discovery

### Browsable API

Django REST Framework provides browsable API at:

```
http://127.0.0.1:8000/api/
```

Click endpoints to explore:

- Make test requests
- View response examples
- See available methods and parameters

### OpenAPI/Swagger (Phase 1+)

Future phases will add:

```
GET /api/schema/ — OpenAPI schema
http://127.0.0.1:8000/api/docs/ — Swagger UI
```

---

## Notes for Implementation

### Phase 0 Tasks

- [ ] Create health check endpoint
- [ ] Configure CORS headers
- [ ] Create API root endpoint
- [ ] Document in README

### Phase 1 Tasks

- [ ] Add authentication endpoints
- [ ] Implement JWT token system
- [ ] Add chat endpoints
- [ ] Add user profile endpoints
- [ ] Add error handling middleware

### Phase 1+ Tasks

- [ ] Add rate limiting
- [ ] Implement pagination
- [ ] Add OpenAPI documentation
- [ ] Create Swagger UI

---

**Status**: ✅ Phase 0 contracts complete  
**Next**: /speckit.tasks for detailed implementation tasks
