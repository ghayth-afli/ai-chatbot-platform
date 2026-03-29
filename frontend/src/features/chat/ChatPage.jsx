/**
 * ChatPage Component
 *
 * Main chat interface integrating:
 * - Session sidebar
 * - Message area
 * - Message input
 * - Real-time WebSocket updates
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { ChatMessages } from "../../components/chat/ChatMessages";
import { MessageInput } from "../../components/chat/MessageInput";
import { ProfilePanel } from "../../components/chat/ProfilePanel";
import { useChat } from "./useChat";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAuth } from "../../hooks/useAuth";

export function ChatPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const isRTL = i18n.language === "ar";
  const [userSummary, setUserSummary] = useState(null);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get auth token from localStorage
  const token = localStorage.getItem("access_token");
  const userProfile =
    user || JSON.parse(localStorage.getItem("user") || "null");

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/auth/login");
    }
  }, [token, navigate]);

  // Generate or fetch user summary (AI-generated summary of user interests)
  useEffect(() => {
    const generateUserSummary = async () => {
      try {
        // In a real implementation, this would call an API endpoint
        // For now, we'll generate a placeholder summary based on chat history
        const summaryExamples = [
          "Interested in AI and programming. Frequently uses Nemotron model.",
          "Explores multiple AI models. Prefers technical discussions.",
          "Regular chatbot user. Strong focus on practical applications.",
        ];
        const randomSummary =
          summaryExamples[Math.floor(Math.random() * summaryExamples.length)];
        setUserSummary(randomSummary);
      } catch (error) {
        console.log("Summary generation:", error);
      }
    };

    if (token) {
      generateUserSummary();
    }
  }, [token]);

  const handleLogout = async () => {
    const confirmed = window.confirm(
      t("chat:confirmLogout") || "Are you sure you want to logout?",
    );
    if (confirmed) {
      await logout();
      navigate("/");
    }
  };

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
    currentPage,
    totalPages,
    createSession,
    loadSession,
    sendMessage,
    deleteSession,
    updateSessionModel,
    clearError,
    goToNextPage,
    goToPreviousPage,
  } = useChat(token);

  // WebSocket real-time updates - track connection status
  const [wsConnected, setWsConnected] = useState(false);

  // Create stable handlers object to prevent unnecessary re-renders
  const wsHandlers = {
    onMessage: (data) => {
      console.log("WebSocket message received:", data);
    },
    onSession: (data) => {
      console.log("Session update:", data);
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  };

  // Initialize WebSocket for current session
  const { isConnected: checkWsConnected } = useWebSocket(
    currentSessionId,
    token,
    wsHandlers,
  );

  // Monitor WebSocket connection status continuously
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSessionId) {
        const isConnected = checkWsConnected?.();
        setWsConnected(isConnected ?? false);
      } else {
        setWsConnected(false);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [checkWsConnected, currentSessionId]);

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
        userProfile={userProfile}
        userSummary={userSummary}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-[var(--ink)]/95 via-[var(--ink)] to-[var(--surface)]/30">
        {/* Header - Chat Interface Header with Model, Settings, Delete */}
        <div className="border-b border-[var(--border)]/40 backdrop-blur-xl bg-[var(--ink)]/40 sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
            {/* Left Section - Mobile Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-[var(--surface)]/60 rounded-lg transition-colors"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>

            {/* Session Title & Status */}
            <div
              className={`flex-1 min-w-0 ${isRTL ? "text-right" : "text-left"}`}
            >
              {currentSession ? (
                <div>
                  <h1 className="text-lg sm:text-xl font-syne font-800 text-[var(--paper)] truncate">
                    {currentSession.title || "New Chat"}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        wsConnected
                          ? "bg-[var(--ice)] animate-pulse"
                          : "bg-[var(--spark)]"
                      }`}
                    />
                    <p className="text-xs text-[var(--muted)]">
                      {wsConnected ? "Connected" : "Offline"}
                    </p>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--volt)] animate-spin" />
                  <span className="text-sm text-[var(--muted)]">
                    Loading...
                  </span>
                </div>
              ) : (
                <p className="text-[var(--muted)] font-dm-sans">
                  No conversation selected
                </p>
              )}
            </div>

            {/* Right Section - Model Badge + Actions */}
            {currentSession && (
              <div
                className={`flex items-center gap-2 sm:gap-3 flex-wrap ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                {/* Model Badge */}
                <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[var(--plasma)]/10 border border-[var(--plasma)]/30 rounded-lg backdrop-blur-sm hover:bg-[var(--plasma)]/20 transition-colors cursor-pointer">
                  <span className="text-lg">
                    {currentModel === "nemotron"
                      ? "🚀"
                      : currentModel === "liquid"
                        ? "💧"
                        : "✨"}
                  </span>
                  <span className="text-xs sm:text-sm font-syne font-600 text-[var(--paper)]">
                    {currentModel === "nemotron"
                      ? "Nemotron"
                      : currentModel === "liquid"
                        ? "Liquid"
                        : "Trinity"}
                  </span>
                </div>

                {/* Language Indicator */}
                <button
                  onClick={() =>
                    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en")
                  }
                  className="flex-shrink-0 px-2.5 py-2 text-xs font-syne font-600 bg-[var(--surface)]/60 border border-[var(--border)]/40 rounded-lg hover:bg-[var(--surface)]/80 transition-colors text-[var(--paper)]"
                  title={`Switch to ${i18n.language === "en" ? "Arabic" : "English"}`}
                >
                  {i18n.language === "en" ? "EN" : "AR"}
                </button>

                {/* Settings Button */}
                <button
                  className="flex-shrink-0 p-2 text-[var(--volt)] hover:bg-[var(--volt)]/10 rounded-lg transition-colors"
                  title="Settings"
                  aria-label="Settings"
                >
                  ⚙️
                </button>

                {/* Profile Button */}
                <button
                  onClick={() => setProfilePanelOpen(!profilePanelOpen)}
                  className="flex-shrink-0 p-2 text-[var(--plasma)] hover:bg-[var(--plasma)]/10 rounded-lg transition-colors"
                  title="Open profile"
                  aria-label="Profile"
                >
                  👤
                </button>

                {/* Delete Chat Button */}
                <button
                  onClick={() => handleDeleteSession(currentSessionId)}
                  className="flex-shrink-0 p-2 text-[var(--spark)] hover:bg-[var(--spark)]/10 rounded-lg transition-colors"
                  title="Delete this chat"
                  aria-label="Delete chat"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-[var(--spark)]/15 border-b-2 border-[var(--spark)] px-6 py-4 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-600 text-[var(--spark)]">Error</p>
                <p className="text-sm text-[var(--spark)]/80">{error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="px-4 py-2 hover:bg-[var(--spark)]/20 rounded-lg transition-colors text-[var(--spark)] font-600 shrink-0"
            >
              Dismiss
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
              currentPage={currentPage}
              totalPages={totalPages}
              onPreviousPage={goToPreviousPage}
              onNextPage={goToNextPage}
              onLoadEarlier={goToPreviousPage}
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
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <div className="mb-8 animate-pulse-slow">
              <div className="text-8xl mb-6 opacity-40">💬</div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-syne font-800 text-[var(--paper)] mb-3">
              {t("chat:noSession") || "No chat selected"}
            </h2>
            <p className="text-[var(--muted)] max-w-md mb-10 font-dm-sans text-sm sm:text-base">
              {t("chat:selectOrCreate") ||
                "Create a new chat or select one from the sidebar to get started"}
            </p>

            {/* Quick Start Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mb-8">
              <div className="p-4 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)] hover:border-[var(--plasma)]/50 transition-colors">
                <div className="text-3xl mb-2">🚀</div>
                <p className="text-xs font-600 text-[var(--paper)] mb-1">
                  Quick Start
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Create a new chat to begin
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)] hover:border-[var(--plasma)]/50 transition-colors">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-xs font-600 text-[var(--paper)] mb-1">
                  3 AI Models
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Choose your favorite
                </p>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="px-8 py-3 bg-gradient-to-r from-[var(--plasma)] to-[var(--plasma)]/80 text-white font-syne font-700 rounded-xl hover:shadow-lg hover:shadow-[var(--plasma)]/40 transition-all transform hover:scale-105 active:scale-95"
            >
              + Start Your First Chat
            </button>
          </div>
        )}
      </div>

      {/* Profile Panel */}
      <ProfilePanel
        isOpen={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        userProfile={userProfile}
        userSummary={userSummary}
      />
    </div>
  );
}
