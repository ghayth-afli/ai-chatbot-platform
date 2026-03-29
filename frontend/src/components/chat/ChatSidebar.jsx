import React, { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * ChatSidebar Component
 *
 * Displays:
 * - Chat session management
 * - User profile section
 * - AI-generated user summary
 * - Language switch
 * - Logout button
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
  userProfile = null,
  userSummary = null,
  onLogout = () => {},
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
      nemotron: "🚀",
      liquid: "💧",
      trinity: "✨",
    };
    return icons[model] || "🤖";
  };

  return (
    <div
      className={`${
        collapsed ? "w-0 overflow-hidden" : "w-64"
      } bg-[var(--surface)]/40 backdrop-blur-xl border-r border-[var(--border)]/40 flex flex-col transition-all duration-300 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div
        className={`p-4 border-b border-[var(--border)]/40 flex items-center justify-between gap-2 backdrop-blur-sm ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <button
          onClick={onNewChat}
          disabled={loading}
          className="flex-1 px-3 py-2.5 bg-gradient-to-r from-[var(--volt)] to-[var(--volt)]/80 text-[var(--ink)] font-600 font-syne rounded-xl text-sm hover:shadow-lg hover:shadow-[var(--volt)]/30 disabled:opacity-50 transition-all duration-200 active:scale-95"
        >
          {t("chat:newChat") || "New Chat"}
        </button>
        <button
          onClick={onToggleCollapsed}
          className="p-2 hover:bg-[var(--surface)]/60 rounded-lg transition-colors text-lg"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading && !sessions.length ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="flex gap-1 mb-3">
              <div
                className="w-2 h-2 rounded-full bg-[var(--volt)] animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-[var(--ice)] animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-[var(--volt)] animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <p className="text-sm text-[var(--muted)] font-dm-sans">
              {t("chat:loading") || "Loading..."}
            </p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center justify-center h-full">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-sm font-syne font-600 text-[var(--paper)]">
              {t("chat:noSessions") || "No conversations yet"}
            </p>
            <p className="text-xs text-[var(--muted)] mt-2 font-dm-sans">
              {t("chat:startNewChat") || "Start a new conversation"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
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
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 backdrop-blur-sm border ${
                      isActive
                        ? "bg-[var(--plasma)]/30 border-[var(--plasma)]/50 shadow-lg shadow-[var(--plasma)]/20"
                        : "bg-[var(--surface)]/30 border-[var(--border)]/20 hover:bg-[var(--surface)]/50 hover:border-[var(--border)]/50"
                    } ${isRTL ? "rtl" : ""}`}
                  >
                    {/* Model Icon + Title */}
                    <div
                      className={`flex items-start gap-3 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <span className="text-xl flex-shrink-0 drop-shadow-sm">
                        {getModelIcon(session.model)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-600 font-syne text-[var(--paper)] truncate ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {session.title}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5 font-dm-sans">
                          {session.message_count}{" "}
                          {t("chat:message") || "messages"}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p
                      className={`text-xs text-[var(--muted)]/70 font-dm-sans ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {formatDate(session.updated_at)}
                    </p>
                  </button>

                  {/* Delete Button - Always Visible on Mobile */}
                  <div
                    className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity ${isRTL ? "left-3 right-auto" : ""}`}
                  >
                    {isDeleting ? (
                      <div
                        className={`flex gap-1.5 p-2 bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/40 rounded-lg shadow-xl ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-[var(--spark)] to-[var(--spark)]/80 text-white rounded-lg font-600 hover:shadow-lg hover:shadow-[var(--spark)]/30 transition-all active:scale-95 font-syne"
                          title="Confirm delete"
                        >
                          {t("chat:confirm") || "Yes"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1.5 text-xs bg-[var(--muted)]/40 text-[var(--paper)] rounded-lg font-600 hover:bg-[var(--muted)]/60 transition-colors font-syne"
                          title="Cancel delete"
                        >
                          {t("chat:cancel") || "No"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(session.id)}
                        className="p-1.5 text-lg text-[var(--spark)] hover:bg-[var(--spark)]/20 rounded-lg transition-colors backdrop-blur-sm"
                        aria-label="Delete session"
                        title="Delete this conversation"
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

      {/* Footer - User Profile, Summary & Logout */}
      <div className="border-t border-[var(--border)]/40 bg-[var(--surface)]/30 backdrop-blur-sm flex flex-col">
        {/* User Summary Section */}
        {userSummary && (
          <div className="p-3 border-b border-[var(--border)]/40">
            <p className="text-xs font-syne font-600 text-[var(--ice)] uppercase tracking-wide mb-2">
              📊 {t("chat:userSummary") || "User Summary"}
            </p>
            <p className="text-xs text-[var(--muted)] leading-relaxed font-dm-sans line-clamp-3">
              {userSummary}
            </p>
          </div>
        )}

        {/* User Profile & Actions */}
        <div className="p-3 space-y-2">
          {/* User Info */}
          {userProfile && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)]/50 hover:bg-[var(--surface)]/80 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--plasma)] to-[var(--plasma)]/70 flex items-center justify-center text-xs font-bold text-white">
                {userProfile.name
                  ? userProfile.name.charAt(0).toUpperCase()
                  : userProfile.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-syne font-600 text-[var(--paper)] truncate">
                  {userProfile.name || userProfile.email}
                </p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {userProfile.email}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Language Toggle */}
            <button
              onClick={() =>
                i18n.changeLanguage(i18n.language === "en" ? "ar" : "en")
              }
              className="flex-1 px-2 py-2 text-xs font-syne font-600 bg-[var(--surface)]/60 border border-[var(--border)]/40 rounded-lg hover:bg-[var(--surface)]/80 transition-colors text-[var(--paper)]"
              title={`Switch to ${i18n.language === "en" ? "Arabic" : "English"}`}
            >
              {i18n.language === "en" ? "عربي" : "ENG"}
            </button>

            {/* Settings Button */}
            <button
              className="flex-1 px-2 py-2 text-xl bg-[var(--surface)]/60 border border-[var(--border)]/40 rounded-lg hover:bg-[var(--surface)]/80 transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              ⚙️
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex-1 px-2 py-2 text-xs font-syne font-600 bg-[var(--spark)]/20 border border-[var(--spark)]/40 text-[var(--spark)] rounded-lg hover:bg-[var(--spark)]/30 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              🚪
            </button>
          </div>

          {/* Tip */}
          <p className="text-xs text-[var(--muted)] text-center pt-1 font-dm-sans">
            💡 {t("chat:chatTip") || "Use different models to explore"}
          </p>
        </div>
      </div>
    </div>
  );
};
