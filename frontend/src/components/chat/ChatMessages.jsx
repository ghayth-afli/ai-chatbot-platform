import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * ChatMessages Component
 *
 * Displays all messages in a conversation with:
 * - User/AI message differentiation with styling
 * - Timestamps and model attribution
 * - Auto-scroll to latest message
 * - Loading and error states
 * - RTL support for Arabic
 */
export const ChatMessages = ({
  messages = [],
  loading = false,
  error = null,
  currentModel = "deepseek",
}) => {
  const { t, i18n } = useTranslation();
  const messagesEndRef = useRef(null);
  const isRTL = i18n.language === "ar";

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
    };
    return modelMap[model] || model;
  };

  if (error) {
    return (
      <div
        className={`flex-1 flex items-center justify-center p-4 ${isRTL ? "rtl" : "ltr"}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="bg-[var(--spark)]/10 border border-[var(--spark)] rounded-lg p-4 text-center">
          <p className="text-[var(--spark)] font-600 mb-2">{t("chat:error")}</p>
          <p className="text-sm text-[var(--muted)]">{error}</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-4 text-center ${isRTL ? "rtl" : "ltr"}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="text-5xl mb-4 opacity-20">💬</div>
        <p className="text-lg text-[var(--muted)] font-500 mb-2">
          {t("chat:noMessages")}
        </p>
        <p className="text-sm text-[var(--muted)] max-w-xs">
          {t("chat:startNewChat")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Messages */}
      {messages.map((msg, index) => {
        const isUser = msg.role === "user";
        const isOptimistic = msg.isOptimistic;

        return (
          <div
            key={msg.id || index}
            className={`flex gap-3 ${isUser ? (isRTL ? "flex-row-reverse justify-end" : "justify-end") : "justify-start"} animate-fadeIn`}
          >
            {/* Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-full bg-[var(--plasma)] flex items-center justify-center flex-shrink-0 text-xs text-white font-bold">
                AI
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                isUser
                  ? "bg-[var(--plasma)] text-white rounded-br-sm"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--paper)] rounded-bl-sm"
              } ${isOptimistic ? "opacity-70" : ""}`}
            >
              <p
                className={`text-sm leading-relaxed ${isRTL ? "text-right" : "text-left"}`}
              >
                {msg.content}
              </p>

              {/* Metadata */}
              <div
                className={`flex gap-2 items-center text-xs mt-2 ${
                  isUser ? "text-white/70" : "text-[var(--muted)]"
                } ${isRTL ? "flex-row-reverse justify-end" : "justify-start"}`}
              >
                {!isUser && msg.model && (
                  <>
                    <span>{getModelLabel(msg.model)}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatTime(msg.created_at)}</span>
                {isOptimistic && (
                  <>
                    <span>•</span>
                    <span className="italic">
                      {t("chat:sending") || "Sending..."}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-full bg-[var(--volt)] flex items-center justify-center flex-shrink-0 text-xs text-[var(--ink)] font-bold">
                👤
              </div>
            )}
          </div>
        );
      })}

      {/* Loading Indicator */}
      {loading && (
        <div
          className={`flex gap-3 ${isRTL ? "flex-row-reverse justify-start" : "justify-start"} animate-pulse`}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--plasma)] flex items-center justify-center flex-shrink-0">
            {/* Animated dots */}
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-100" />
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-200" />
            </div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3 rounded-bl-sm">
            <p className="text-sm text-[var(--muted)] italic">
              {t("chat:aiResponding") || "AI is responding..."}
            </p>
          </div>
        </div>
      )}

      {/* Scroll Anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};
