import React, { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * ChatSidebar Component
 *
 * Displays list of chat sessions and provides:
 * - Quick access to previous conversations
 * - Session management (create, delete)
 * - Active session highlighting
 * - Last message preview
 * - RTL support
 */
export const ChatSidebar = ({
  sessions = [],
  currentSessionId = null,
  onSelectSession = () => {},
  onNewChat = () => {},
  onDeleteSession = () => {},
  loading = false,
  collapsed = false,
  onToggleCollapsed = () => {},
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("chat:yesterday") || "Yesterday";
    }

    return date.toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
    });
  };

  const getModelIcon = (model) => {
    const icons = {
      deepseek: "🧠",
      llama3: "🦙",
      mistral: "⚡",
    };
    return icons[model] || "🤖";
  };

  return (
    <div
      className={`${
        collapsed ? "w-0 overflow-hidden" : "w-64"
      } bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transition-all duration-300 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div
        className={`p-4 border-b border-[var(--border)] flex items-center justify-between gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <button
          onClick={onNewChat}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-[var(--volt)] text-[var(--ink)] font-600 rounded-lg text-sm hover:bg-[var(--volt)]/90 disabled:opacity-50 transition-colors"
        >
          {t("chat:newChat") || "New Chat"}
        </button>
        <button
          onClick={onToggleCollapsed}
          className="p-2 hover:bg-[var(--surface)]/50 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {loading && !sessions.length ? (
          <div className="p-4 text-center text-sm text-[var(--muted)]">
            {t("chat:loading") || "Loading..."}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-sm text-[var(--muted)]">
            <p>{t("chat:noSessions") || "No conversations yet"}</p>
            <p className="text-xs mt-2 opacity-50">
              {t("chat:startNewChat") || "Start a new conversation"}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isDeleting = deleteConfirmId === session.id;

              return (
                <div
                  key={session.id}
                  className={`group relative ${isRTL ? "rtl" : "ltr"}`}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-[var(--plasma)]/20 border border-[var(--plasma)]"
                        : "hover:bg-[var(--surface)]/50"
                    }`}
                  >
                    {/* Model Icon + Title */}
                    <div
                      className={`flex items-start gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <span className="text-lg flex-shrink-0">
                        {getModelIcon(session.model)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-500 text-[var(--paper)] truncate ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {session.title}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {session.message_count}{" "}
                          {t("chat:message") || "messages"}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p
                      className={`text-xs text-[var(--muted)] ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {formatDate(session.updated_at)}
                    </p>
                  </button>

                  {/* Delete Button */}
                  <div
                    className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? "left-0 right-auto" : ""}`}
                  >
                    {isDeleting ? (
                      <div
                        className={`flex gap-1 p-2 bg-[var(--surface)] rounded-lg ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="px-2 py-1 text-xs bg-[var(--spark)] text-white rounded hover:bg-[var(--spark)]/90"
                        >
                          {t("chat:confirm") || "Yes"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-xs bg-[var(--muted)] text-[var(--ink)] rounded hover:bg-[var(--muted)]/90"
                        >
                          {t("chat:cancel") || "No"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(session.id)}
                        className="p-2 text-[var(--spark)] hover:bg-[var(--spark)]/10 rounded-lg"
                        aria-label="Delete session"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Helpful hint */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]/50 text-xs text-[var(--muted)]">
        <p className={isRTL ? "text-right" : "text-left"}>
          💡 {t("chat:chatWith") || "Chat with"}{" "}
          {sessions.length > 0 ? "different models" : "your favorite AI"}
        </p>
      </div>
    </div>
  );
};
