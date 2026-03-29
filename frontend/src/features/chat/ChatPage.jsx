/**
 * ChatPage Component
 *
 * Main chat interface integrating:
 * - Session sidebar
 * - Message area
 * - Message input
 * - Real-time WebSocket updates
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { ChatMessages } from "../../components/chat/ChatMessages";
import { MessageInput } from "../../components/chat/MessageInput";
import { useChat } from "./useChat";
import { useWebSocket } from "../../hooks/useWebSocket";

export function ChatPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Get auth token from localStorage
  const token = localStorage.getItem("token");

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Chat state management
  const {
    sessions,
    currentSessionId,
    currentSession,
    currentModel,
    messages,
    loading,
    sending,
    error,
    createSession,
    loadSession,
    sendMessage,
    deleteSession,
    updateSessionModel,
    clearError,
  } = useChat(token);

  // WebSocket real-time updates
  const {
    connected: wsConnected,
    messages: wsMessages,
    addMessage: wsAddMessage,
  } = useWebSocket(token, !!token);

  // Update messages from WebSocket
  useEffect(() => {
    if (wsMessages && wsMessages.length > 0) {
      const lastWsMsg = wsMessages[wsMessages.length - 1];
      // Only update if message is for current session
      if (lastWsMsg.session_id === currentSessionId) {
        wsAddMessage(lastWsMsg);
      }
    }
  }, [wsMessages, currentSessionId, wsAddMessage]);

  const handleNewChat = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      await loadSession(sessionId);
    }
  };

  const handleSelectSession = async (sessionId) => {
    await loadSession(sessionId);
    clearError();
  };

  const handleDeleteSession = async (sessionId) => {
    const confirmed = window.confirm(
      t("chat:deleteChat") || "Delete this conversation?",
    );
    if (confirmed) {
      await deleteSession(sessionId);
    }
  };

  const handleSendMessage = async (messageText, model) => {
    await sendMessage(messageText, model);
  };

  const handleUpdateModel = async (model) => {
    if (currentSessionId) {
      await updateSessionModel(currentSessionId, model);
    }
  };

  return (
    <div
      className={`h-screen w-full flex bg-[var(--ink)] text-[var(--paper)] overflow-hidden ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        loading={loading}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-gradient-to-b from-[var(--surface)] to-transparent border-b border-[var(--border)] px-6 flex items-center justify-between">
          <div className={isRTL ? "text-right" : "text-left"}>
            {currentSession ? (
              <>
                <h2 className="text-lg font-600 text-[var(--paper)]">
                  {currentSession.title || "Chat"}
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  {wsConnected ? "🟢 " : "🔴 "}
                  {wsConnected ? t("chat:online") : t("chat:offline")}
                </p>
              </>
            ) : (
              <p className="text-[var(--muted)]">
                {t("chat:noSessions") || "No conversation selected"}
              </p>
            )}
          </div>

          {/* Model Indicator */}
          {currentSession && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-2xl">
                {currentModel === "deepseek"
                  ? "🧠"
                  : currentModel === "llama3"
                    ? "🦙"
                    : "⚡"}
              </span>
              <span className="text-[var(--muted)]">
                {currentModel === "deepseek"
                  ? "DeepSeek"
                  : currentModel === "llama3"
                    ? "LLaMA 3"
                    : "Mistral"}
              </span>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-[var(--spark)]/10 border-b border-[var(--spark)] px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-[var(--spark)]">{error}</p>
            <button
              onClick={clearError}
              className="text-xs text-[var(--spark)] hover:underline"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages Area */}
        {currentSessionId ? (
          <>
            <ChatMessages
              messages={messages}
              loading={sending}
              error={null}
              currentModel={currentModel}
            />

            {/* Input Area */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onModelChange={handleUpdateModel}
              selectedModel={currentModel}
              disabled={!currentSessionId || loading}
              loading={sending}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="text-6xl mb-4 opacity-20">💬</div>
            <h3 className="text-xl font-600 mb-2 text-[var(--paper)]">
              {t("chat:title") || "Chat with AI"}
            </h3>
            <p className="text-[var(--muted)] max-w-md mb-6">
              {t("chat:startNewChat") ||
                "Start a new conversation or select an existing chat"}
            </p>
            <button
              onClick={handleNewChat}
              className="px-6 py-3 bg-[var(--volt)] text-[var(--ink)] font-600 rounded-lg hover:bg-[var(--volt)]/90 transition-colors"
            >
              {t("chat:newChat") || "Start New Chat"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
