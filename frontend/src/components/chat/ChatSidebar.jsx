/**
 * ChatSidebar Component
 *
 * Modern redesigned sidebar with Nexus design system
 * Displays:
 * - Logo and new chat button
 * - User card with profile info
 * - AI-generated user summary
 * - Search functionality
 * - Chat history list with model indicators
 * - Footer with export, settings, and additional actions
 * - RTL support for Arabic
 */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ChatSidebar.module.css";

export const ChatSidebar = ({
  sessions = [],
  currentSessionId = null,
  onSelectSession = () => {},
  onNewChat = () => {},
  onDeleteSession = () => {},
  loading = false,
  userProfile = null,
  userSummary = null,
  onLogout = () => {},
  isOpen = true,
  onToggle = () => {},
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  const getModelColor = (model) => {
    const colors = {
      nemotron: "var(--volt)",
      liquid: "var(--plasma)",
      trinity: "var(--ice)",
    };
    return colors[model] || "var(--muted)";
  };

  const filteredSessions = sessions.filter((session) =>
    session.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={onToggle}
          dir={isRTL ? "rtl" : "ltr"}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header - Logo + New Chat Button */}
        <div className={styles.head}>
          <a href="/" className={styles.logo}>
            nexus<span className={styles.dot}>.</span>
            <span className={styles.badge}>AI</span>
          </a>
          <button
            className={styles.newChatBtn}
            onClick={onNewChat}
            disabled={loading}
            title="New Chat"
            aria-label="Create new chat"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 2v10M2 7h10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* User Card */}
        {userProfile && (
          <div className={styles.userCard}>
            <div className={styles.userCardInner}>
              <div className={styles.avatar}>
                {getInitials(userProfile.name || userProfile.email)}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>
                  {userProfile.name || userProfile.email}
                </div>
                <div className={styles.userSub}>
                  PRO · {i18n.language.toUpperCase()}
                </div>
              </div>
              <span className={styles.userChevron}>▾</span>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {userSummary && (
          <div className={styles.aiSummary}>
            <div className={styles.summaryTag}>
              <span className={styles.summaryDot} />
              <span>{t("chat:aiSummary") || "AI Summary"}</span>
            </div>
            <div className={styles.summaryText}>{userSummary}</div>
          </div>
        )}

        {/* Search */}
        <div className={styles.search}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            type="text"
            placeholder={t("chat:searchChats") || "Search chats…"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* History Label */}
        <div className={styles.historyLabel}>
          {t("chat:recentChats") || "Recent Chats"}
        </div>

        {/* History List */}
        <div className={styles.historyList}>
          {loading && !sessions.length ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>💬</p>
              <p className={styles.emptyText}>
                {t("chat:loading") || "Loading..."}
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>🔍</p>
              <p className={styles.emptyText}>
                {searchQuery
                  ? t("chat:noResults") || "No results found"
                  : t("chat:noChats") || "No chats yet"}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isDeleting = deleteConfirmId === session.id;

              return (
                <div key={session.id} className={styles.histItem}>
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`${styles.histItemBtn} ${
                      isActive ? styles.active : ""
                    }`}
                  >
                    <span className={styles.histIcon}>
                      {getModelIcon(session.model)}
                    </span>
                    <div className={styles.histContent}>
                      <div className={styles.histTitle}>{session.title}</div>
                      <div className={styles.histMeta}>
                        <span
                          className={styles.modelDot}
                          style={{
                            background: getModelColor(session.model),
                          }}
                        />
                        {formatDate(session.updated_at)}
                      </div>
                    </div>
                  </button>

                  {/* Delete Button */}
                  {isDeleting ? (
                    <div className={styles.deleteConfirm}>
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className={styles.confirmYes}
                        title="Confirm"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className={styles.confirmNo}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(session.id);
                      }}
                      className={styles.deleteBtn}
                      title="Delete"
                      hidden={!isActive}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.sfBtn} title="Export chat">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M6.5 1v7M3.5 5l3 3 3-3M1.5 10h10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t("chat:export") || "Export"}</span>
          </button>
          <button className={styles.sfBtn} title="Settings">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle
                cx="6.5"
                cy="6.5"
                r="2"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M6.5 1v1M6.5 11v1M1 6.5h1M11 6.5h1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span>{t("chat:settings") || "Settings"}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
