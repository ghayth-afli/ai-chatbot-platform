import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PaginationControls } from "./PaginationControls";

/**
 * ChatMessages Component
 *
 * Displays all messages in a conversation with:
 * - User/AI message differentiation with styling
 * - Timestamps and model attribution
 * - Auto-scroll to latest message
 * - Loading and error states
 * - Pagination controls for large conversations
 * - RTL support for Arabic
 */
export const ChatMessages = ({
  messages = [],
  loading = false,
  error = null,
  currentModel = "deepseek",
  currentPage = 1,
  totalPages = 1,
  onPreviousPage = null,
  onNextPage = null,
  onLoadEarlier = null,
}) => {
  const { t, i18n } = useTranslation();
  const messagesEndRef = useRef(null);
  const isRTL = i18n.language === "ar";

  const models = [
    { id: "deepseek", name: "DeepSeek", icon: "🧠" },
    { id: "llama3", name: "LLaMA 3", icon: "🦙" },
    { id: "mistral", name: "Mistral", icon: "⚡" },
    { id: "nemotron", name: "Nemotron", icon: "🚀" },
  ];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getModelLabel = (model) => {
    const modelMap = {
      deepseek: "DeepSeek",
      llama3: "LLaMA 3",
      mistral: "Mistral",
      nemotron: "Nemotron",
    };
    return modelMap[model] || model;
  };

  console.log(
    "🎯 ChatMessages rendered. Messages count:",
    messages?.length || 0,
    "Messages:",
    messages,
  );

  if (messages && messages.length > 0) {
    console.log("📋 Message details:");
    messages.forEach((msg, idx) => {
      console.log(
        `  [${idx}] role=${msg.role}, content=${msg.content?.substring(0, 50)}..., id=${msg.id}`,
      );
    });
  }

  if (error) {
    return (
      <div
        className={`flex-1 flex items-center justify-center p-6 ${isRTL ? "rtl" : "ltr"}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="bg-[var(--spark)]/20 border-2 border-[var(--spark)] rounded-2xl p-6 text-center max-w-md backdrop-blur-sm">
          <p className="text-2xl mb-3">⚠️</p>
          <p className="text-[var(--spark)] font-600 font-syne mb-2">Error</p>
          <p className="text-sm text-[var(--muted)]">{error}</p>
        </div>
      </div>
    );
  }

  console.log(
    "🔍 ChatMessages render check - messages:",
    messages,
    "is empty?",
    !messages || messages.length === 0,
  );

  if (!messages || messages.length === 0) {
    console.log("🏳️ Returning empty state for ChatMessages");
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fadeIn ${isRTL ? "rtl" : "ltr"}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="mb-6">
          <div className="text-7xl mb-4 opacity-40 animate-pulse-slow">💬</div>
        </div>
        <h2 className="text-2xl sm:text-3xl text-[var(--paper)] font-syne font-800 mb-2">
          {t("chat:noMessages") || "Start a conversation"}
        </h2>
        <p className="text-sm sm:text-base text-[var(--muted)] max-w-xs mb-8 font-dm-sans">
          {t("chat:startNewChat") ||
            "Pick a model and type something to get started"}
        </p>

        {/* Quick Tips */}
        <div className="w-full max-w-sm space-y-3">
          <div className="flex gap-3 items-start p-4 bg-[var(--surface)]/50 border border-[var(--border)] rounded-xl backdrop-blur-sm">
            <span className="text-xl mt-1">🚀</span>
            <div
              className={`text-xs text-[var(--muted)] ${isRTL ? "text-right" : "text-left"}`}
            >
              <p className="font-600 text-[var(--paper)] mb-1">Quick Start</p>
              <p>Select a model, type your message, and hit Enter to send</p>
            </div>
          </div>
          <div className="flex gap-3 items-start p-4 bg-[var(--plasma)]/5 border border-[var(--plasma)]/30 rounded-xl">
            <span className="text-xl">⌨️</span>
            <div
              className={`text-xs text-[var(--muted)] ${isRTL ? "text-right" : "text-left"}`}
            >
              <p className="font-600 text-[var(--paper)] mb-1">
                Keyboard Shortcuts
              </p>
              <p>Shift+Enter for line break • Ctrl+L to clear • ↑ to retry</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log(
    "✅ Rendering messages container - messages.length:",
    messages.length,
  );

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
      data-testid="messages-container"
    >
      {/* Messages */}
      {messages.map((msg, index) => {
        console.log(`🗣️ Rendering message [${index}]:`, msg);
        const isUser = msg.role === "user";
        const isOptimistic = msg.isOptimistic;
        const modelObj = models.find((m) => m.id === msg.model);

        console.log(
          `  ↩️ About to return message element for message ${index}`,
        );
        const returnElement = (
          <div
            key={msg.id || index}
            className={`flex gap-3 items-end ${
              isUser
                ? isRTL
                  ? "flex-row-reverse justify-end"
                  : "justify-end"
                : "justify-start"
            } animate-fadeIn group`}
            data-testid={`message-wrapper-${index}`}
          >
            {/* AI Avatar */}
            {!isUser && (
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[var(--plasma)] to-[var(--plasma)]/70 flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-lg shadow-[var(--plasma)]/30">
                {modelObj?.icon || "🤖"}
              </div>
            )}

            {/* Message Container */}
            <div
              className={`max-w-[90%] sm:max-w-[65%] ${
                isRTL ? "flex-row-reverse" : ""
              } flex gap-2 items-end`}
            >
              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-4 backdrop-blur-sm transition-all duration-300 ${
                  isUser
                    ? "bg-gradient-to-br from-[var(--plasma)] to-[var(--plasma)]/80 text-white rounded-br-md shadow-lg shadow-[var(--plasma)]/30 hover:shadow-xl hover:shadow-[var(--plasma)]/40"
                    : "bg-[var(--surface)]/60 border border-[var(--border)] text-[var(--paper)] rounded-bl-md hover:bg-[var(--surface)]/80 hover:border-[var(--plasma)]/30"
                } ${isOptimistic ? "opacity-70 italic" : ""}`}
              >
                {/* AI Model Tag */}
                {!isUser && msg.model && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-mono font-600 text-[var(--ice)] uppercase tracking-widest">
                      {getModelLabel(msg.model)}
                    </span>
                    <span className="text-[var(--border)] text-opacity-50">
                      •
                    </span>
                  </div>
                )}

                {/* Message Content */}
                <p
                  className={`text-sm sm:text-base leading-relaxed font-dm-sans ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  data-testid={`message-content-${index}`}
                >
                  {console.log(
                    `  📝 Rendering content for message ${index}: "${msg.content?.substring(0, 30)}..."`,
                  )}
                  {msg.content}
                </p>

                {/* Timestamp */}
                <div
                  className={`flex items-center gap-2 text-xs mt-2 ${
                    isUser ? "text-white/60" : "text-[var(--muted)]"
                  } font-mono`}
                >
                  <span>{formatTime(msg.created_at)}</span>
                  {isOptimistic && (
                    <>
                      <span>•</span>
                      <span className="italic">sending...</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[var(--volt)] to-[var(--volt)]/70 flex items-center justify-center text-xs sm:text-sm font-bold text-[var(--ink)] shadow-lg shadow-[var(--volt)]/30">
                👤
              </div>
            )}
          </div>
        );
        console.log(`  ✅ Returned message element for message ${index}`);
        return returnElement;
      })}

      {/* Loading Indicator */}
      {loading && (
        <div
          className={`flex gap-3 items-end animate-fadeIn ${
            isRTL ? "flex-row-reverse justify-start" : "justify-start"
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[var(--plasma)] to-[var(--plasma)]/70 flex items-center justify-center">
            <div className="flex gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--volt)] animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--ice)] animate-bounce"
                style={{ animationDelay: "200ms" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--volt)] animate-bounce"
                style={{ animationDelay: "400ms" }}
              />
            </div>
          </div>
          <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-[var(--surface)]/60 border border-[var(--border)] max-w-[90%] sm:max-w-[65%]">
            <p className="text-sm text-[var(--muted)] italic font-dm-sans">
              {t("chat:aiResponding") || "typing..."}
            </p>
          </div>
        </div>
      )}

      {/* Scroll Anchor */}
      <div ref={messagesEndRef} />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPreviousPage={onPreviousPage}
            onNextPage={onNextPage}
            onLoadEarlier={onLoadEarlier}
            loading={loading}
            isRTL={isRTL}
          />
        </div>
      )}
    </div>
  );
};
