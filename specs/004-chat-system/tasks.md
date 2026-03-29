# Phase 4 Tasks: Chat System, Chat History & User Summary

**Branch**: `004-chat-system` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Feature**: Phase 4 — Chat System, Chat History & User Summary  
**MVP Scope**: User Story 1 + 2 (P1 stories) complete = Core chat + session management  
**Status**: 60/60 tasks complete (100%) ✅ - PHASE 4 COMPLETE
**Total Tasks**: 60 | **Setup**: 6/6 ✅ | **Foundational**: 8/8 ✅ | **US1**: 12/12 ✅ | **US2**: 10/10 ✅ | **US3**: 8/8 ✅ | **US4**: 4/4 ✅ | **US5**: 4/4 ✅ | **US6**: 2/2 ✅ | **Polish**: 6/6 ✅

---

## Dependency Graph & Execution Strategy

```
PHASE 1 (Setup) → PHASE 2 (Foundational) → PHASE 3 (User Stories in parallel)
      ↓                    ↓
  (T001–T006)         (T007–T014)
  Prerequisites        Infrastructure

PHASE 3 Stories (Can run in parallel after foundational):
  US1 (P1): T015–T026  [Send message to AI]
  US2 (P1): T027–T036  [Create & manage sessions]
  US3 (P2): T037–T044  [View history]
  US4 (P2): T045–T048  [Delete sessions]
  US5 (P2): T049–T052  [Switch models]
  US6 (P3): T053–T054  [Summaries]

PHASE 4 (Polish): T055–T060
```

### Parallel Execution Map

**After T014 (foundational complete)**, run these in any order:

- T015–T026 (US1 backend message routing)
- T027–T036 (US2 backend session CRUD)
- Run together: T015+T027 (backend refactoring benefits)

**After all US1+US2 backend complete (T026)**, run:

- T037–T044 (US3 history retrieval)
- T045–T048 (US4 delete logic)
- T049–T052 (US5 model routing)

**After backend stable (T054)**, run:

- T055–T060 (Polish, testing, optimization)

### Suggested MVP Implementation Path (2-week sprint)

**Week 1**:

- T001–T014: Setup + foundational (2 days)
- T015–T026: US1 backend (3 days)

**Week 2**:

- T027–T054: US2–US5 backend (3.5 days)
- T055–T060: Polish + testing (1.5 days)

---

## Phase 1: Setup (Project Initialization) ✅ COMPLETE

- [x] T001 Create Django chats app with default structure
- [x] T002 Create frontend chat components directory structure
- [x] T003 Initialize database models scaffold and migrations directory
- [x] T004 Create API router module structure at backend/chats/router.py
- [x] T005 Create frontend WebSocket service file structure
- [x] T006 Update package.json with required dependencies (socket.io-client, axios upgrades)

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

### Backend Infrastructure

- [x] T007 Update backend/config/settings.py to add chats app, Django Channels, WebSocket routing configuration
- [x] T008 Create backend/config/asgi.py WebSocket consumer with JWT authentication middleware
- [x] T009 Create backend/config/websocket.py with WebSocket connection handler, message broadcaster, and authentication
- [x] T010 Add Django Channels to backend/requirements.txt with pinned version (channels==4.0.0 or latest)
- [x] T011 Create backend/chats/**init**.py, apps.py, admin.py with ChatSession and Message admin registration

### Frontend Infrastructure

- [x] T012 Create frontend/src/services/websocket.js with WebSocket client initialization, event handlers, auto-reconnect logic
- [x] T013 Create frontend/src/hooks/useWebSocket.js custom hook with connection state, event listeners, message broadcasting
- [x] T014 Update frontend/src/i18n/en.json and ar.json with chat-specific UI text keys (send, new-chat, delete, model-label, etc.)

---

## Phase 3: User Stories (In Priority Order)

### User Story 1: Send Message to AI Model and Receive Response (Priority: P1)

**Goal**: User selects model, sends message, AI processes via selected provider, response displays and saves  
**Acceptance**: Message appears instantly, AI response received in < 15 seconds, both saved to database  
**Independent Test**: Send message to DeepSeek, LLaMA 3, Mistral; verify response quality and database storage

#### Backend Tasks (AI Routing + Message Handling) ✅ COMPLETE

- [x] T015 Create backend/chats/models.py: ChatSession model (id, user_id, title, model, language, created_at, updated_at), Message model (id, session_id, sender, message, language, created_at)
- [x] T016 Create database migrations for ChatSession and Message models; apply migrations to db.sqlite3
- [x] T017 Create backend/chats/serializers.py with ChatSessionSerializer and MessageSerializer for API responses
- [x] T018 Create backend/chats/router.py with three functions: route_to_openrouter(model_id, message, api_key) for DeepSeek/Mistral, route_to_groq(model_id, message, api_key) for LLaMA 3, dispatch_to_provider(model, message, user_id) that calls correct router based on model string
- [x] T019 Create backend/chats/services.py with ChatService class: send_message(session_id, message, model, language) that saves user message, calls router, saves AI response, returns response dict
- [x] T020 Create backend/chats/views.py with ChatViewSet and POST /api/chat/send endpoint that accepts {session_id, message, model, language}, validates input, calls ChatService.send_message(), returns {response, session_id, model}
- [x] T021 Create backend/chats/urls.py with router.register('chat', ChatViewSet) and POST /api/chat/send path
- [x] T022 Update backend/config/urls.py to include chats URLs: include chats.urls
- [x] T023 Create backend/tests/test_chat_router.py with unit tests for router functions: test_route_to_openrouter_deepseek, test_route_to_groq_llama3, test_dispatch_selects_correct_router
- [x] T024 Create backend/tests/test_chat_send.py with integration test: test_send_message_to_ai_saves_to_db, test_response_appears_in_session, test_model_selection_routing

#### Frontend Tasks (Message Input + Send) ✅ COMPLETE

- [x] T025 Create frontend/src/components/chat/MessageInput.jsx component with text input field, send button, model dropdown, character count (max 5000), disabled state during loading
- [x] T026 Create frontend/src/services/chatService.js with sendMessage(sessionId, message, model, language) function that calls POST /api/chat/send, handles errors, returns response; include optimistic rendering helper

---

### User Story 2: Create New Chat Session and Manage Multiple Conversations (Priority: P1)

**Goal**: User creates sessions, each has independent history and model preference; user can switch between sessions  
**Acceptance**: Create session < 1 second, previous messages load on switch, all sessions sorted by updated_at  
**Independent Test**: Create 3 sessions, send different messages to each, switch and verify history preserved

#### Backend Tasks (Session CRUD + History) ✅ COMPLETE

- [x] T027 Create backend/chats/views.py POST /api/chat/new-session endpoint that creates ChatSession with auto-title ("Chat 001" format), user_id from JWT token, language from request/defaults to 'en', returns {session_id, title, model, language, created_at}
- [x] T028 Create backend/chats/views.py GET /api/chat/sessions endpoint that retrieves all user's ChatSessions sorted by updated_at DESC, returns paginated list of sessions with basic metadata
- [x] T029 Create backend/chats/views.py GET /api/chat/sessions/{id} endpoint that retrieves all Messages for session {id} in chronological order (created_at ASC), verify user owns session (403 if not), return paginated messages with sender/timestamp/content
- [x] T030 Update backend/chats/services.py ChatService with create_session(user_id, language='en') method that generates title, saves session, returns session dict
- [x] T031 Update backend/chats/services.py ChatService with get_user_sessions(user_id) method that queries all ChatSessions for user, orders by updated_at DESC, returns list
- [x] T032 Update backend/chats/services.py ChatService with get_session_messages(user_id, session_id, page=1) method that queries Messages for session, verifies user owns session (raises PermissionDenied if not), returns paginated results
- [x] T033 Create backend/tests/test_chat_crud.py with test_create_session_auto_title, test_get_user_sessions_sorted, test_get_session_messages_chronological, test_user_cannot_access_other_session
- [x] T034 Update backend/chats/urls.py with POST /api/chat/new-session, GET /api/chat/sessions, GET /api/chat/sessions/{id} paths
- [x] T035 Create frontend/src/features/chat/useChatSessions.js custom hook with state for sessions list, currentSession, loading; functions createSession(), getAvailableSessions(), loadSession(id)
- [x] T036 Create frontend/src/components/chat/ChatSidebar.jsx component displaying sessions list (session title, timestamp, delete button stub), new chat button, sorted by most recent first

---

### User Story 3: View Chat History and Access Previous Conversations (Priority: P2)

**Goal**: Users see all sessions in sidebar; clicking session loads full history for review or continuation  
**Acceptance**: All sessions visible with preview, 500+ message session loads < 2s, messages in correct order  
**Independent Test**: Create 10 sessions across 3 days, close/reopen app, verify all reappear in history

#### Backend Tasks (History Retrieval + Optimization)

- [x] T037 Add database indexes to backend/chats/models.py: index on ChatSession (user_id, updated_at), index on Message (session_id, created_at) for fast queries
- [x] T038 Update backend/chats/services.py with paginate_messages(messages, page=1, page_size=50) method that splits large sessions into pages, returns {page, total_pages, messages}
- [x] T039 Create backend/chats/views.py with pagination support in GET /api/chat/sessions/{id}?page=1 to return 50 messages per page
- [x] T040 Create backend/tests/test_history_performance.py with test measuring GET /api/chat/sessions/{large_id} with 500+ messages completes in < 2 seconds

#### Frontend Tasks (Sidebar + History Display)

- [x] T041 Create frontend/src/components/chat/PaginationControls.jsx component for paginated message display
- [x] T042 Update frontend/src/components/chat/ChatMessages.jsx to integrate with pagination controls
- [x] T043 Create frontend/src/features/chat/useChat.js custom hook managing chat state: currentSession, messages, loading; functions loadSession(id), prependMessages(newMessages)
- [x] T044 Create frontend/src/pages/Chat.jsx page layout combining ChatSidebar + ChatMessages + MessageInput in 2-column layout (desktop) or collapsible sidebar (mobile)

---

### User Story 4: Delete Chat Sessions (Priority: P2)

**Goal**: User can delete session + all messages; deletion is immediate and permanent  
**Acceptance**: Session disappears from UI < 500ms, reappears on refresh = never, database clean  
**Independent Test**: Delete session, refresh page, verify gone; second user cannot see deleted session

#### Backend Tasks (Delete + Cascade)

- [x] T045 Create backend/chats/views.py DELETE /api/chat/sessions/{id} endpoint that verifies user owns session, cascading delete: ChatSession + all its Messages, returns {status: 'deleted', message: 'Session removed'}
- [x] T046 Update backend/chats/models.py Message model with on_delete=models.CASCADE on session_id foreign key to auto-delete messages when session deleted
- [x] T047 Create backend/tests/test_delete_session.py with test_delete_session_removes_all_messages, test_user_cannot_delete_other_session, test_cascading_delete_verified

#### Frontend Tasks (Delete UI + Confirmation)

- [x] T048 Create frontend/src/components/chat/DeleteSessionButton.jsx component with delete button, confirmation dialog "Delete this chat?", calls backend DELETE, removes from sidebar UI

---

### User Story 5: Switch Between AI Models in Chat Interface (Priority: P2)

**Goal**: User selects model from dropdown; subsequent messages route to that model  
**Acceptance**: Model selection persists for session, message routing verified correct (FR-004)  
**Independent Test**: Send same question to DeepSeek, LLaMA 3, Mistral; verify different responses from each provider

#### Backend Tasks (Model Validation + Routing)

- [x] T049 Update backend/chats/services.py send_message() method to validate model in ("deepseek", "llama3", "mistral"), raise ValueError if invalid
- [x] T050 Update backend/chats/router.py dispatch_to_provider() to include model validation + logging of which provider called for each model
- [x] T051 Create backend/tests/test_model_routing.py with test_deepseek_routes_to_openrouter, test_llama3_routes_to_groq, test_mistral_routes_to_openrouter, test_invalid_model_raises_error

#### Frontend Tasks (Model Dropdown + State)

- [x] T052 Create frontend/src/components/chat/ModelSelector.jsx dropdown component with options ["DeepSeek", "LLaMA 3", "Mistral"], default to "DeepSeek", state persists for session

---

### User Story 6: Generate and View AI-Generated User Summary (Priority: P3)

**Goal**: System generates summary of user's chat patterns every 15–20 messages; user can view or regenerate  
**Acceptance**: Summary generated < 5 seconds, accurately describes user interests, stored in database  
**Independent Test**: Send 20+ messages across topics, generate summary, verify describes patterns correctly

#### Backend Tasks (Summary Generation)

- [x] T053 Update backend/summaries/models.py UserSummary model: id, user_id, summary (text), language, message_count, updated_at; add method check_if_summary_needed(user_id) to check if >15–20 new messages since last summary
- [x] T054 Create backend/summaries/services.py SummaryService with generate_summary(user_id, language='en') method that: collects user's recent messages, calls OpenRouter with default model (DeepSeek) with prompt to summarize interests, saves to UserSummary, returns summary text

---

### User Story 7: Multi-Language Support (EN/AR) Across Chat System (Priority: P3)

**Dependent**: Already satisfied by foundational tasks T014 (i18next keys) + model language fields

**Frontend Integration**:

- [x] T055 (covered by T014): Chat UI respects i18n context; language toggle switches all text
- [x] T056 (covered by models.py): Messages stored with language field for historical accuracy

---

## Phase 4: Polish & Cross-Cutting Concerns

### Testing & Quality

- [x] T057 Create end-to-end test suite in frontend/tests/e2e/chat-flow.test.js using Playwright: test "user creates session, sends message, receives response, deletes session, session gone"; measures performance thresholds from spec (< 15s response, < 2s load)
- [x] T058 Create backend/tests/test_websocket.py testing WebSocket message broadcasting: test "message sent on device A appears instantly on device B", test "unauthenticated WebSocket rejected"

### API Documentation & Error Handling

- [x] T059 Create backend/chats/documentation.md documenting all 5 chat endpoints: request/response formats, error codes, example cURL commands; include validation rules (max 5000 char message, model enum, language enum)
- [x] T060 Update backend/chats/views.py all endpoints with comprehensive error handling: try/except blocks, user-friendly error messages, 400 for validation errors, 403 for permission errors, 500 for API provider failures

---

## Task Checklist Format Reference

Every task follows:

```
- [ ] TXXX [optional: P] [optional: [USX]] Description with file path
```

**Example compliant tasks**:

- `- [ ] T001 Create Django chats app with default structure` ✅
- `- [ ] T015 [P] Create backend/chats/models.py: ChatSession and Message models` ✅
- `- [ ] T025 [US1] Create frontend/src/components/chat/MessageInput.jsx component` ✅

---

## Definition of Done (per Task)

Each task is complete when:

1. **Code written** to specification in exact file path
2. **Tests pass** (unit tests for that component/function)
3. **Integration verified** (works with adjacent completed tasks)
4. **No console errors** (Chrome DevTools clean for frontend, Django logs clean for backend)
5. **Meets performance target** if applicable (e.g., T039 < 2s load, T054 < 5s summary generation)
6. **Documentation updated** (code comments, API docs, or README if needed)
7. **Committed to branch** with clear commit message

---

## Parallel Execution Guidelines

**Can run truly parallel** (no merged output):

- T001–T006: All independent setup
- T015 + T027: Backend model creation (different files)
- T025 + T026: Frontend input + service (independent)

**Must sequence** (output of first feeds into second):

- T007 before T009 (settings needed by asgi.py)
- T015 before T016 (models needed for migrations)
- T015 before T023 (models needed for tests)

**Recommend sequential** (same developer/context):

- T015 → T016 → T023 → T024 (chat message flow is cohesive)
- T027 → T028 → T029 → T033 (session CRUD is cohesive)

---

## Success Criteria per Phase

**Setup (T001–T006)**: ✅ All structure in place, no runtime errors  
**Foundational (T007–T014)**: ✅ Django app loads, WebSocket accepts connections, i18n keys loaded  
**US1 (T015–T026)**: ✅ Can send message to AI, response appears and saves  
**US2 (T027–T036)**: ✅ Can create session, view history, switch sessions  
**US3–US5 (T037–T052)**: ✅ History loads < 2s, delete works, model selection routed correctly  
**US6 (T053–T054)**: ✅ Summary generates < 5s with accurate topic description  
**Polish (T055–T060)**: ✅ E2E tests pass, error handling comprehensive, docs complete

---

## Critical Notes for LLM Implementation

1. **Do NOT guess file paths** — Use exact paths specified (e.g., `backend/chats/models.py`, not `backend/chat/models.py`)
2. **Do NOT skip migrations** — Each backend model change requires T016 database migration
3. **Do NOT hardcode API keys** — Use `os.environ.get('OPENROUTER_API_KEY')` only
4. **Do NOT mix concerns** — Keep models in models.py, views in views.py, services in services.py
5. **Do NOT ignore task dependencies** — T015 (models) must complete before T016 (migrations)
6. **Do NOT ship without tests** — Each backend task includes corresponding test task
7. **Do NOT assume library versions** — Check requirements.txt for exact versions
8. **Message max 5000 chars** — Enforce in MessageInput component AND in services.py
9. **Language stored as model field** — Every message/session has `language` field ('en' or 'ar')
10. **User isolation verified in views** — Every endpoint checks `request.user == message.session.user` before returning data

---

## Command to Validate Task Completeness

After implementing each task, verify:

```bash
# Backend: Run tests
pytest backend/tests/test_chat_router.py -v
pytest backend/tests/test_chat_crud.py -v
pytest backend/tests/test_history_performance.py -v

# Frontend: Check build
npm run build --prefix frontend

# Database: Check migrations applied
python backend/manage.py showmigrations chats

# API: Smoke test
curl -H "Authorization: Bearer {TOKEN}" http://localhost:8000/api/chat/sessions/
```

---

## No External Knowledge Required

All context needed to complete these tasks is in:

1. This tasks.md file (exact file paths, requirements)
2. The spec.md (what needs to be built)
3. The plan.md (technical architecture)
4. Existing code in backend/ and frontend/ (patterns to follow)
5. Constitution.md (coding standards)

**Do not rely on**:

- External tutorials
- Assumptions about how other apps work
- Your training knowledge of OpenRouter/Groq APIs (it's in the code!)

---

## Summary

**60 total tasks** across 4 phases:

- **Phase 1 (Setup)**: 6 tasks — Directories, files, dependencies
- **Phase 2 (Foundational)**: 8 tasks — Django Channels, WebSocket, i18n
- **Phase 3 (User Stories)**: 40 tasks — Core features (US1–US6)
- **Phase 4 (Polish)**: 6 tasks — Testing, docs, error handling

**MVP = Phases 1–2 + US1 + US2** (36 tasks, ~2 weeks)  
**Full = All phases** (60 tasks, ~4 weeks)

**Critical success factors**:

1. Each task completely self-contained
2. No guessing at file paths or API details
3. All tests included (not added later)
4. Sequential dependencies respected
5. Clear definition of done for each task
