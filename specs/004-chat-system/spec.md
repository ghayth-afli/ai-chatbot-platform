# Feature Specification: Phase 4 — Chat System, Chat History & User Summary

**Feature Branch**: `004-chat-system`  
**Created**: March 29, 2026  
**Status**: Draft  
**Input**: User description: "Phase 4 — Chat System, Chat History & User. AI Multi-Model Chatbot Platform (nexus.ai) with chat sessions, messages storage, history management, AI-generated summaries, multi-language support (EN/AR), and integration with OpenRouter and Groq APIs."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Send Message to AI Model and Receive Response (Priority: P1)

Authenticated user opens the chat interface, selects an AI model from a dropdown, types a message, and sends it. The message appears instantly, the AI processes it through the selected provider (OpenRouter or Groq), and the response is displayed in the chat. Both user message and AI response are persisted to the database.

**Why this priority**: Core functionality—the fundamental capability that defines the platform. Without this, there is no chatbot.

**Independent Test**: Can be fully tested by: Creating a chat session, sending a message to each model (Nemotron, LLaMA 3, Trinity), and verifying the response appears and is saved. Delivers immediate value: users can chat with AI.

**Acceptance Scenarios**:

1. **Given** user is authenticated and on the chat interface, **When** user selects "Nemotron" model and sends "Explain REST APIs", **Then** message appears instantly in chat, backend receives it, routes to OpenRouter, and AI response displays within reasonable time (< 15 seconds) and is saved to database.

2. **Given** user has an active chat session, **When** user sends a message in Arabic, **Then** the message is saved with language="ar", sent to the selected AI model, and the response is returned correctly.

3. **Given** user selects model "LLaMA 3", **When** user sends a message, **Then** request is routed to Groq API (not OpenRouter) and response is returned from Groq.

4. **Given** user is in an active chat, **When** they switch from Nemotron to Trinity mid-conversation, **Then** the new model selection takes effect for subsequent messages and model preference is visible in the UI.

---

### User Story 2 - Create New Chat Session and Manage Multiple Conversations (Priority: P1)

User can initiate a new chat session at any time. Each session is independent with its own title, model preference, and message history. User can see a list of all their chat sessions, click to switch between them, and continue past conversations.

**Why this priority**: Essential for conversation management. Allows users to organize chats by topic and compare different AI model responses on similar topics.

**Independent Test**: Can be tested by: Creating multiple chat sessions, sending messages in each, switching between them, and verifying previous messages are preserved. Delivers value: users build a conversation library.

**Acceptance Scenarios**:

1. **Given** user clicks "New Chat", **When** the system creates a new session with auto-generated title "Chat 001" (or similar), **Then** the session appears in the history sidebar and user can send messages to it independently.

2. **Given** user has 3 chat sessions, **When** they click on an existing session, **Then** all previous messages load correctly and they can continue the conversation.

3. **Given** user is in a chat session, **When** they view the sidebar, **Then** sessions are sorted by last updated date (most recent first).

4. **Given** user creates a new session and sends a message, **When** a new session is auto-created for a different model, **Then** both sessions are independent and switching between them preserves both message histories.

---

### User Story 3 - View Chat History and Access Previous Conversations (Priority: P2)

A visible sidebar or dedicated history section displays all user's chat sessions. Each session shows a preview (title, date, model used) and clicking to open it loads that conversation's entire message history for review or continuation.

**Why this priority**: High importance for user experience. Without easy access to history, users lose context and value of previous conversations.

**Independent Test**: Can be tested by: Sending messages across multiple sessions, closing and reopening the app, verifying all sessions and messages reappear correctly. Delivers value: users maintain conversation continuity.

**Acceptance Scenarios**:

1. **Given** user has 10 previous chat sessions, **When** they open the chat interface, **Then** all 10 sessions are listed in the sidebar with titles, timestamps, and model used.

2. **Given** user clicks on a session from 3 days ago, **When** the session loads, **Then** all messages from that conversation appear in chronological order with proper sender attribution (user vs. AI).

3. **Given** user is viewing chat history, **When** they hover over or long-press a session, **Then** they see a "delete" option and can remove that session.

4. **Given** user has 50+ sessions, **When** they scroll the history sidebar, **Then** sessions load progressively without performance degradation.

---

### User Story 4 - Delete Chat Sessions (Priority: P2)

User can delete individual chat sessions. Once deleted, the session and all its messages are removed from the database and the UI reflects this immediately.

**Why this priority**: Important for data management. Users need control over their conversation history and privacy.

**Independent Test**: Can be tested by: Deleting a session, reopening the app, verifying it doesn't reappear. Delivers value: users manage their data.

**Acceptance Scenarios**:

1. **Given** user has a chat session open, **When** they click the delete button, **Then** a confirmation dialog appears asking "Delete this chat?".

2. **Given** user confirms deletion, **When** the session is deleted, **Then** it disappears from the sidebar immediately and a success message displays.

3. **Given** user has multiple sessions, **When** they delete one, **Then** other sessions remain unaffected and accessible.

4. **Given** user deletes a session, **When** they refresh the page, **Then** the session is permanently gone and does not reappear.

---

### User Story 5 - Switch Between AI Models in Chat Interface (Priority: P2)

User can select which AI model to use from a dropdown menu. Model selection persists for the session and each message can specify its target model. The backend intelligently routes requests to the correct API provider based on model choice.

**Why this priority**: Differentiator for the platform. Allows users to compare model outputs and choose the best provider for their use case.

**Independent Test**: Can be tested by: Sending the same message to each model and comparing responses. Delivers value: users find their preferred model.

**Acceptance Scenarios**:

1. **Given** user is in a chat session, **When** they click the model dropdown, **Then** they see three options: "Nemotron", "LLaMA 3", and "Trinity" with current selection highlighted.

2. **Given** user selects "Nemotron", **When** they send a message, **Then** the request routes to OpenRouter with model_id="Nemotron-chat".

3. **Given** user changes to "LLaMA 3", **When** they send a message, **Then** the request routes to Groq with model_id="Liquid-8b-8192".

4. **Given** user selects "Trinity", **When** they send a message, **Then** the request routes to OpenRouter with model_id="Trinity-7b".

---

### User Story 6 - Generate and View AI-Generated User Summary (Priority: P3)

The system periodically generates an AI-driven summary of the user's chat behavior and interests. User can view their current summary and manually trigger a new summary generation. The summary describes topics they frequently ask about, interests, language preference, and interaction patterns.

**Why this priority**: Nice-to-have feature for engagement. Provides users with insights about themselves and demonstrates AI capabilities.

**Independent Test**: Can be tested by: Sending 15+ messages across topics, triggering summary generation, and reviewing the summary. Delivers value: users get personality insights.

**Acceptance Scenarios**:

1. **Given** user has had 15+ messages across multiple sessions, **When** they click "View Summary", **Then** an AI-generated summary displays describing their interests and patterns.

2. **Given** user clicks "Generate Summary", **When** the system collects their messages and sends them to an AI model, **Then** a new summary is generated within 5 seconds and replaces the old one.

3. **Given** user's summary is in Arabic, **When** they switch the UI language to English, **Then** the summary is available in English (or marked as "Arabic only" if not translated).

4. **Given** user has <5 messages, **When** they click "Generate Summary", **Then** the system displays "Need more conversations to generate summary" or generates a summary with appropriate disclaimers.

---

### User Story 7 - Multi-Language Support (EN/AR) Across Chat System (Priority: P3)

The chat interface, messages, and summaries support both English and Arabic. Users can switch languages from the UI toggle, and the system adapts: UI text changes, chat direction becomes RTL for Arabic, and new chats default to the selected language.

**Why this priority**: Important for regional reach and user accessibility. Secondary to core chat functionality but essential for complete market coverage.

**Independent Test**: Can be tested by: Toggling language, sending messages in both languages, verifying UI direction and text rendering. Delivers value: Arabic speakers have full experience.

**Acceptance Scenarios**:

1. **Given** user is in English interface, **When** they click the language toggle to switch to Arabic, **Then** the entire UI becomes RTL, all text changes to Arabic, and new chat sessions default to language="ar".

2. **Given** user sends a message in Arabic, **When** the message is saved, **Then** it's stored with language="ar" so historical queries know the language.

3. **Given** user has a chat in English, **When** they switch UI language to Arabic while reviewing that chat, **Then** messages remain in their original English but UI elements display in Arabic.

4. **Given** user uploads or switches to Arabic, **When** a new chat is created, **Then** the model selection and system messages reflect the language preference automatically.

---

### Edge Cases

- What happens when the AI API (OpenRouter or Groq) is temporarily unavailable? → System displays "API unavailable" and allows retry.
- How does the system handle extremely long messages (>5000 characters)? → System splits or truncates with user warning before sending.
- What if a user sends messages faster than API can respond (rate limiting)? → Queue messages and display "Waiting..." indicator; prevent duplicate sends.
- How does the system handle a user deleting a session while a message is being sent? → Complete the send, then delete the session.
- What if a session is deleted on another device while user has it open locally? → Next sync or page refresh shows session no longer exists; clear local view.
- How does the system handle switching models mid-stream (before API responds)? → Cancel in-flight request and start new request with new model.
- What if AI response is extremely long (>10000 tokens)? → Display in scrollable format; optionally paginate or provide "read more" functionality.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to create a new chat session with an auto-generated title and timestamp.

- **FR-002**: System MUST store each chat session with: `id` (UUID), `user_id` (UUID), `title` (string), `model` (string), `language` (en/ar), `created_at` (DateTime), `updated_at` (DateTime).

- **FR-003**: System MUST accept user messages and store them with: `id` (UUID), `session_id` (UUID), `sender` (user/ai), `message` (text), `language` (en/ar), `created_at` (DateTime).

- **FR-004**: System MUST route AI requests to the correct API provider based on model selection:
  - If model="Nemotron" → OpenRouter API with model_id="Nemotron-chat"
  - If model="Liquid" → Groq API with model_id="Liquid-8b-8192"
  - If model="Trinity" → OpenRouter API with model_id="Trinity-7b"

- **FR-005**: System MUST receive AI response from provider, save AI message to database, and return response to frontend within a reasonable timeout (< 60 seconds per API call).

- **FR-006**: System MUST provide endpoint `POST /api/chat/new-session` to create a new chat session, returning session ID and initial metadata.

- **FR-007**: System MUST provide endpoint `GET /api/chat/sessions` to retrieve all sessions for the authenticated user, sorted by `updated_at` descending.

- **FR-008**: System MUST provide endpoint `GET /api/chat/sessions/{id}` to retrieve all messages for a specific session in chronological order.

- **FR-009**: System MUST provide endpoint `POST /api/chat/send` accepting `{session_id, message, model, language}` and returning `{response, session_id, model}`.

- **FR-010**: System MUST provide endpoint `DELETE /api/chat/sessions/{id}` to permanently delete a session and all its messages.

- **FR-011**: System MUST support user summary generation via AI: collect user messages, generate summary describing topics/interests/patterns, and store in database.

- **FR-012**: System MUST provide endpoint `GET /api/summary` to retrieve user's current summary (if it exists).

- **FR-013**: System MUST provide endpoint `POST /api/summary/generate` to trigger on-demand summary generation from recent user messages.

- **FR-014**: System MUST generate summaries automatically every 15–20 messages for all users by default (opt-out). Users can disable summary generation in account settings at any time; disabling stops future summaries but preserves existing ones. Users can re-enable summaries anytime.

- **FR-015**: System MUST support both English and Arabic in chat interface, with proper RTL (right-to-left) layout for Arabic.

- **FR-016**: System MUST store language preference (`language` field in sessions and messages) and respect it when rendering UI and chat history.

- **FR-017**: System MUST validate API keys at startup and log warnings if OpenRouter or Groq keys are missing.

- **FR-018**: System MUST implement error handling for API failures: return user-friendly error messages, log server-side errors, and allow retries.

- **FR-019**: System MUST validate user input (trim whitespace, sanitize content, enforce max length) before sending to AI providers.

- **FR-020**: System MUST ensure messages appear instantly in UI (optimistic rendering) before server confirmation to improve perceived responsiveness.

- **FR-021**: System MUST support real-time multi-device synchronization via WebSocket (Socket.io or similar): when user sends/receives message on one device, it appears simultaneously on all other devices they're logged into without requiring page refresh or manual polling.

- **FR-022**: System MUST broadcast user connection/disconnection status and real-time presence indicators (e.g., "User is typing...") to all active client connections for that user.

- **FR-023**: System MUST provide export functionality for chat sessions: users can export individual sessions or all chats in JSON (structured), CSV (spreadsheet), or PDF (printable) format. Export is initiated from chat UI and downloaded directly to user's device.

### Key Entities _(include if feature involves data)_

- **ChatSession**: Represents a conversation between user and AI. Attributes: `id` (UUID, primary key), `user_id` (UUID, foreign key to User), `title` (string, auto-generated or user-provided), `model` (string, one of: "Nemotron", "Liquid", "Trinity"), `language` (enum: "en", "ar"), `created_at` (DateTime), `updated_at` (DateTime). Relationships: One session has many Messages; one User has many ChatSessions.

- **Message**: Represents an individual message in a session. Attributes: `id` (UUID, primary key), `session_id` (UUID, foreign key to ChatSession), `sender` (enum: "user", "ai"), `message` (text, up to 10,000 characters), `language` (enum: "en", "ar"), `created_at` (DateTime). Relationships: Many messages belong to one ChatSession.

- **UserSummary**: Stores AI-generated summary of user behavior. Attributes: `id` (UUID, primary key), `user_id` (UUID, foreign key to User), `summary` (text, max 2,000 characters), `language` (enum: "en", "ar"), `message_count` (int, number of messages summarized), `updated_at` (DateTime). Relationships: One user has one UserSummary (or one per language).

- **AIProvider**: Configuration for AI API providers. Attributes: `name` (string: "openrouter", "groq"), `api_key` (string, from environment), `status` (enum: "active", "inactive"), `last_checked` (DateTime). Used for routing and monitoring.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a chat session in under 1 second and start sending messages immediately after session creation.

- **SC-002**: 95% of AI responses are delivered to the user's browser within 15 seconds of message send (measured in production across all three models).

- **SC-003**: System supports simultaneous chats across unlimited sessions without performance degradation; loading a session with 500+ messages takes < 2 seconds.

- **SC-004**: Chat history displays all 100% of previous sessions and messages accurately after page refresh or app restart; no message loss or data corruption.

- **SC-005**: Users can delete a session and see it removed from UI within 500ms; deletion is permanent after refresh.

- **SC-006**: Model switching is seamless; users can change models mid-conversation and the new model is used for the next message without errors.

- **SC-007**: AI-generated user summaries are generated within 5 seconds of trigger and accurately summarize the user's interests based on their message history (verified by manual review of 10+ summaries).

- **SC-008**: Arabic language support functions identically to English: all UI elements display correctly in RTL, messages send/receive properly, and summaries generate in Arabic when requested.

- **SC-009**: System gracefully handles API failures: if OpenRouter or Groq is temporarily down, user sees "Service temporarily unavailable. Please try again in a moment." and can retry without data loss.

- **SC-010**: End-to-end encrypted or secure data transmission (HTTPS) ensures user messages are transmitted securely; no plain-text message content in logs.

- **SC-011**: 90% of users successfully complete their first chat (create session, send message, receive response) without help or error within their first 2 minutes on the app.

- **SC-012**: Chat UI is responsive and functional on desktop (1920px+), tablet (768–1023px), and mobile (320–767px) with no layout breaking or message loss on smaller screens.

- **SC-013**: Users can export individual chat sessions or all chats in JSON, CSV, or PDF format from the chat interface within 2 seconds and download to their device successfully.

## Assumptions

- **Authentication is implemented**: Phase 3 has already delivered JWT-based authentication; users are logged in before accessing the chat system.

- **Database is set up**: Django models and migrations are ready; we use the existing SQLite or PostgreSQL setup from earlier phases.

- **API keys are configured**: OPENROUTER_API_KEY and GROQ_API_KEY are set in environment variables (`.env`); system will log warnings if missing but not crash.

- **Frontend framework is React**: Based on project structure; we use React components and state management (context or Redux) to manage chat state.

- **Existing navigation and authentication flows are stable**: Chat system will integrate with existing navbar, login, and user context.

- **Users have stable internet connectivity**: Streaming or long polling for real-time messages is not required; standard HTTP request/response plus WebSocket for real-time sync is acceptable.

- **WebSocket infrastructure available**: Backend will have WebSocket support (Socket.io, Django Channels, or equivalent) for real-time message broadcasting across multiple user devices.

- **Brand identity and design system are defined**: The platform has established color schemes, typography, and component styles (Tailwind CSS with custom theme). Chat UI will follow these standards.

- **Responsive design is enforced**: All UI components respect mobile-first responsive design; no desktop-only features.

- **Error handling is user-centric**: Error messages are in plain language (user-friendly) not technical jargon; users understand what went wrong and how to recover.

- **Summary generation uses the default model**: User summaries are generated using the `DEFAULT_MODEL` (currently "Nemotron"); changes to this config apply to all future summaries.

- **Message length limits are enforced**: Messages are limited to a reasonable length (e.g., 5,000 characters) to prevent abuse and excessive API costs.

- **Concurrency is handled at the backend level**: Django handles concurrent requests safely; no race conditions on session creation or message insertion.

- **No enforced user limits**: System has no hard maximums on session count or message count per user. Performance targets (loading 500+ messages in < 2s, unlimited sessions without degradation) define practical scaling limits. Users scale organically with platform growth.

- **Message Retention**: Messages and chat sessions are retained indefinitely in the database until the user manually deletes them. No automatic archival or deletion occurs based on time or inactivity.

---

## Clarifications

### Session March 29, 2026

- Q: How long are messages and sessions retained? → A: **Indefinitely, retained until manually deleted by user.** System does not auto-delete messages based on age or inactivity. This allows users to maintain full conversation history across all their sessions. Users can delete individual sessions at any time to free storage if desired.

- Q: Should summary generation be opt-in or opt-out? → A: **Opt-out (automatic by default).** System generates summaries automatically for all users every 15–20 messages without requiring explicit consent. Users can disable summary generation feature in account settings at any time. Once disabled, no new summaries are generated, but existing summaries remain visible. Users can re-enable at any time.

- Q: Are there maximum limits on sessions or messages per user? → A: **No enforced maximums; system scales by design.** System is architected to scale to 100+ sessions and 1000+ messages per user without performance degradation. Rather than imposing artificial caps, the design relies on performance targets (SC-003: load session with 500+ messages in < 2 seconds) to define practical limits. Users never encounter "quota exceeded" errors during normal use.

- Q: How are updates synced across multiple devices? → A: **Real-time sync via WebSocket (Socket.io or similar).** When a user sends or receives a message on one device (e.g., mobile), it appears instantly on all other devices they're logged into (e.g., desktop, tablet) without requiring page refresh. This is achieved via WebSocket bidirectional communication and server-side real-time event broadcasting to all active client connections for that user.

- Q: Can users export their chat history? → A: **Yes, export included in Phase 4.** Users can export individual chat sessions or all their chats from the chat interface. Export formats supported: JSON (machine-readable), CSV (spreadsheet-friendly), and PDF (human-readable). Export button available in chat session options menu. Users can download exports directly without leaving the app.

---

## Brand and UI/UX Requirements

- **Design System**: Chat UI must respect `brand_identity_chatbot_genz.html` brand guidelines, including color palette, typography, and visual style.

- **Responsive & Attractive**: UI must be smooth, visually attractive, and responsive across all screen sizes (mobile 320px, tablet 768px, desktop 1920px+).

- **Smooth Interactions**: Message sending, loading, and switching between sessions must feel responsive with appropriate loading indicators and animations.

- **Accessibility**: Proper ARIA labels, keyboard navigation, and focus management follow existing navbar/auth patterns from earlier phases.

---

## Out of Scope (Phase 4)

- Message editing or deleting individual messages (future phase)
- Voice input for messages (future phase)
- Image/file upload support (future phase)
- Message reactions/emojis (future phase)
- User-to-user chat or collaboration (future phase)
- Advanced analytics dashboard (future phase)
- Message search functionality (future enhancement)
- Advanced export formats (e.g., HTML with styling) — basic JSON/CSV/PDF supported per FR-23
