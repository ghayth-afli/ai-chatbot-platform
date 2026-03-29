import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * MessageInput Component - Modern Design
 *
 * Features:
 * - Model selector with custom pills (not dropdown)
 * - Glassmorphic input area
 * - Character counter with visual feedback
 * - Smooth animations and transitions
 * - Full responsive design
 */
export const MessageInput = ({
  onSendMessage,
  onModelChange,
  selectedModel = "deepseek",
  disabled = false,
  loading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState("");
  const [model, setModel] = useState(selectedModel);
  const textareaRef = useRef(null);
  const isRTL = i18n.language === "ar";

  const MAX_LENGTH = 5000;
  const charCount = message.length;
  const isOverLimit = charCount > MAX_LENGTH;

  const models = [
    { id: "deepseek", name: "DeepSeek", icon: "🧠", desc: "Fast & Powerful" },
    { id: "llama3", name: "LLaMA 3", icon: "🦙", desc: "Open Source" },
    { id: "mistral", name: "Mistral", icon: "⚡", desc: "Efficient" },
    { id: "nemotron", name: "Nemotron", icon: "🚀", desc: "Super 120B" },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || isOverLimit || disabled || loading) {
      return;
    }

    onSendMessage(message.trim(), model);
    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModelSelect = (modelId) => {
    setModel(modelId);
    onModelChange(modelId);
  };

  return (
    <div
      className={`relative px-4 py-6 bg-gradient-to-t from-[var(--ink)] via-[var(--surface)]/50 to-transparent ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Model Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModelSelect(m.id)}
              disabled={disabled || loading}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-500 text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                model === m.id
                  ? "bg-[var(--plasma)] text-white shadow-lg shadow-[var(--plasma)]/40"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--paper)] hover:border-[var(--plasma)]/50 hover:bg-[var(--surface)]/80"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-base">{m.icon}</span>
              <span className="font-syne font-600">{m.name}</span>
              {model === m.id && <span className="text-sm">✓</span>}
            </button>
          ))}
        </div>

        {/* Glassmorphic Input Area */}
        <div className="relative backdrop-blur-xl rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-4 shadow-2xl shadow-black/20 transition-all duration-300 focus-within:border-[var(--plasma)]/50 focus-within:shadow-lg focus-within:shadow-[var(--plasma)]/20">
          {/* Message Input */}
          <div
            className={`flex gap-3 items-end ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                t("chat:message-placeholder") || "What's on your mind..."
              }
              disabled={disabled || loading}
              className={`flex-1 bg-transparent text-[var(--paper)] placeholder-[var(--muted)]/60 focus:outline-none resize-none font-dm-sans max-h-[200px] overflow-y-auto ${isRTL ? "text-right" : "text-left"}`}
              rows="1"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={disabled || loading || !message.trim() || isOverLimit}
              aria-label={t("chat:send") || "Send message"}
              className={`flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--plasma)] hover:bg-[var(--plasma)]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                loading ? "animate-pulse" : ""
              }`}
              title={isOverLimit ? "Message too long" : "Send message (Enter)"}
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-lg">↑</span>
              )}
            </button>
          </div>

          {/* Character Counter */}
          {charCount > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]/50 flex items-center justify-between">
              <div className="w-full h-1 bg-[var(--surface)]/50 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverLimit ? "bg-[var(--spark)]" : "bg-[var(--volt)]"
                  }`}
                  style={{
                    width: `${Math.min((charCount / MAX_LENGTH) * 100, 100)}%`,
                  }}
                />
              </div>
              <span
                className={`ml-3 text-xs font-mono whitespace-nowrap ${
                  isOverLimit
                    ? "text-[var(--spark)] font-600"
                    : "text-[var(--muted)]"
                }`}
              >
                {charCount}/{MAX_LENGTH}
              </span>
            </div>
          )}
        </div>

        {/* Usage Tip */}
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] px-2">
          <span>💡</span>
          <span>
            {t("chat:tip-keyboard") ||
              "Press Enter to send, Shift+Enter for new line"}
          </span>
        </div>
      </div>
    </div>
  );
};
