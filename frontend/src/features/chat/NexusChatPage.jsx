/**
 * NexusChat - Direct port of nexus_chat.html to React
 * Complete chat interface with all original Nexus design
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChat } from "./useChat";
import { useAuth } from "../../hooks/useAuth";
import styles from "./NexusChatPage.module.css";

export function ChatPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const isRTL = i18n.language === "ar";

  // Get auth token
  const token = localStorage.getItem("access_token");
  const userProfile =
    user || JSON.parse(localStorage.getItem("user") || "null");

  // State
  const [chatInput, setChatInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("nemotron");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Chat hook
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
  } = useChat(token);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/auth/login");
    }
  }, [token, navigate]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [chatInput]);

  // Handle send message
  const handleSend = async () => {
    if (!chatInput.trim() || !currentSessionId) return;
    await sendMessage(chatInput.trim(), selectedModel);
    setChatInput("");
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !sending) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle new chat
  const handleNewChat = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      await loadSession(sessionId);
      setSidebarOpen(false);
    }
  };

  // Format date helper
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
      return "Yesterday";
    }
    return date.toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
    });
  };

  // Get model icon
  const getModelIcon = (model) => {
    const icons = { nemotron: "🚀", liquid: "💧", trinity: "✨" };
    return icons[model] || "🤖";
  };

  // Get model color
  const getModelColor = (model) => {
    const colors = {
      nemotron: "#C8FF00",
      liquid: "#7B5CFF",
      trinity: "#00D4E8",
    };
    return colors[model] || "#6B6878";
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`${styles.app} ${isRTL ? styles.rtl : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHead}>
          <a href="/" className={styles.logo}>
            nexus<span className={styles.dot}>.</span>
            <span className={styles.badge}>AI</span>
          </a>
          <button
            className={styles.newChatBtn}
            onClick={handleNewChat}
            disabled={loading}
            title="New Chat"
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
              <div>
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

        {/* Search */}
        <div className={styles.sidebarSearch}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            type="text"
            placeholder="Search chats…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.historyLabel}>RECENT CHATS</div>

        {/* History List */}
        <div className={styles.historyList}>
          {filteredSessions.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              <p style={{ fontSize: "28px", marginBottom: "10px" }}>💬</p>
              <p>{searchQuery ? "No results" : "No chats yet"}</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className={styles.histItem}>
                <button
                  className={`${styles.histItemBtn} ${
                    session.id === currentSessionId ? styles.active : ""
                  }`}
                  onClick={() => {
                    loadSession(session.id);
                    setSidebarOpen(false);
                  }}
                >
                  <span className={styles.histIcon}>
                    {getModelIcon(session.model)}
                  </span>
                  <div className={styles.histContent}>
                    <div className={styles.histTitle}>{session.title}</div>
                    <div className={styles.histMeta}>
                      <span
                        className={styles.modelDot}
                        style={{ background: getModelColor(session.model) }}
                      />
                      {formatDate(session.updated_at)}
                    </div>
                  </div>
                </button>
                {deleteConfirmId === session.id ? (
                  <div className={styles.deleteConfirm}>
                    <button
                      onClick={() => deleteSession(session.id)}
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
                    onClick={() => setDeleteConfirmId(session.id)}
                    className={styles.deleteBtn}
                    visible={session.id === currentSessionId}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <button className={styles.sfBtn} title="Export">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M6.5 1v7M3.5 5l3 3 3-3M1.5 10h10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Export Chat</span>
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
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.chatHeader}>
          <div className={styles.headerLeft}>
            <button
              className={styles.mobToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M2 8h12M2 12h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Model Selector */}
            <div className={styles.modelSelectWrap}>
              <div className={styles.modelSelect} title="Select model">
                <div
                  className={styles.modelDot}
                  style={{ background: getModelColor(selectedModel) }}
                />
                <span className={styles.modelNameLabel}>
                  {selectedModel === "nemotron"
                    ? "Nemotron"
                    : selectedModel === "liquid"
                      ? "Liquid"
                      : "Trinity"}
                </span>
                <span className={styles.modelChevron}>▾</span>
              </div>
              <div className={styles.modelDropdown}>
                {["nemotron", "liquid", "trinity"].map((model) => (
                  <div
                    key={model}
                    className={`${styles.modelOpt} ${model === selectedModel ? styles.selected : ""}`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <div
                      className={styles.modelDot}
                      style={{ background: getModelColor(model) }}
                    />
                    <div className={styles.modelOptInfo}>
                      <div className={styles.modelOptName}>
                        {model === "nemotron"
                          ? "Nemotron"
                          : model === "liquid"
                            ? "Liquid"
                            : "Trinity"}
                      </div>
                      <div className={styles.modelOptDesc}>
                        {model === "nemotron"
                          ? "Reasoning · Code · Analysis"
                          : model === "liquid"
                            ? "Fast · Thinking · Inference"
                            : "Efficient · Mini · Versatile"}
                      </div>
                    </div>
                    {model === selectedModel && (
                      <span className={styles.modelCheck}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.langTog}>
              <button
                className={`${styles.ltBtn} ${i18n.language === "en" ? styles.on : ""}`}
                onClick={() => i18n.changeLanguage("en")}
              >
                EN
              </button>
              <button
                className={`${styles.ltBtn} ${i18n.language === "ar" ? styles.on : ""}`}
                onClick={() => i18n.changeLanguage("ar")}
              >
                عر
              </button>
            </div>
            <button className={styles.logoutBtn} onClick={() => logout()}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M8 4l3 2-3 2M5 6h6M7 2H2.5A.5.5 0 002 2.5v7a.5.5 0 00.5.5H7"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Sign Out</span>
            </button>
            <button
              className={styles.logoutBtn}
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                borderColor: "rgba(123,92,255,.3)",
                color: "var(--plasma)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle
                  cx="6"
                  cy="4"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M1.5 11c0-2.485 2.015-4.5 4.5-4.5S10.5 8.515 10.5 11"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              <span>Profile</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className={styles.messagesWrap}>
          <div className={styles.messagesInner}>
            {!currentSessionId ? (
              <div className={styles.welcome}>
                <div className={styles.welcomeLogo}>
                  nexus<span className={styles.dot}>.</span>
                </div>
                <div className={styles.welcomeSub}>
                  Your AI co-pilot. Ask anything.
                </div>
                <div className={styles.suggestionGrid}>
                  <div className={styles.sugCard}>
                    <div className={styles.sugIcon}>📖</div>
                    <div className={styles.sugTitle}>Explain</div>
                    <div className={styles.sugDesc}>
                      Clarify complex concepts
                    </div>
                  </div>
                  <div className={styles.sugCard}>
                    <div className={styles.sugIcon}>📊</div>
                    <div className={styles.sugTitle}>Analyze</div>
                    <div className={styles.sugDesc}>Deep dive into data</div>
                  </div>
                  <div className={styles.sugCard}>
                    <div className={styles.sugIcon}>⚙️</div>
                    <div className={styles.sugTitle}>Code</div>
                    <div className={styles.sugDesc}>Write & debug code</div>
                  </div>
                  <div className={styles.sugCard}>
                    <div className={styles.sugIcon}>🐛</div>
                    <div className={styles.sugTitle}>Debug</div>
                    <div className={styles.sugDesc}>Find & fix issues</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${styles.msg} ${msg.role === "user" ? styles.user : styles.ai}`}
                  >
                    <div className={styles.msgAvatar}>
                      {msg.role === "user" ? "👤" : "🤖"}
                    </div>
                    <div className={styles.msgBody}>
                      <div className={styles.msgMeta}>
                        {msg.role === "ai" && (
                          <span className={styles.metaModel}>Nemotron</span>
                        )}
                      </div>
                      <div className={styles.msgBubble}>{msg.content}</div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className={styles.typingMsg}>
                    <div className={styles.msgAvatar}>🤖</div>
                    <div className={styles.typingBubble}>
                      <div className={styles.td} />
                      <div className={styles.td} />
                      <div className={styles.td} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        {currentSessionId && (
          <div className={styles.inputArea}>
            <div className={styles.inputWrap}>
              <div className={styles.inputBox}>
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything…"
                  disabled={sending}
                  className={styles.chatTextarea}
                  rows="1"
                />
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={!chatInput.trim() || sending}
                  title="Send (Enter)"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path
                      d="M2 7.5H13M13 7.5L8.5 3M13 7.5L8.5 12"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className={styles.inputFooter}>
                <span className={styles.inputHint}>
                  Shift+Enter for new line
                </span>
                <span className={styles.charCount}>
                  {chatInput.length} / 4000
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Profile Panel */}
      {profileOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setProfileOpen(false)}
          />
          <div
            className={`${styles.profilePanel} ${profileOpen ? styles.open : ""}`}
          >
            <div className={styles.ppHead}>
              <span className={styles.ppTitle}>My Profile</span>
              <button
                className={styles.ppClose}
                onClick={() => setProfileOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.ppBody}>
              <div className={styles.ppAvatarBig}>
                {getInitials(userProfile?.name || userProfile?.email)}
              </div>
              <div className={styles.ppName}>
                {userProfile?.name || userProfile?.email}
              </div>
              <div className={styles.ppEmail}>{userProfile?.email}</div>

              <div className={styles.ppStatRow}>
                <div className={styles.ppStat}>
                  <div className={styles.ppStatN}>12</div>
                  <div className={styles.ppStatL}>Chats</div>
                </div>
                <div className={styles.ppStat}>
                  <div className={styles.ppStatN}>84</div>
                  <div className={styles.ppStatL}>Messages</div>
                </div>
                <div className={styles.ppStat}>
                  <div className={styles.ppStatN}>3</div>
                  <div className={styles.ppStatL}>Models</div>
                </div>
              </div>

              <button className={styles.ppLogout} onClick={() => logout()}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M8 4l3 2-3 2M5 6h6M7 2H2.5A.5.5 0 002 2.5v7a.5.5 0 00.5.5H7"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
