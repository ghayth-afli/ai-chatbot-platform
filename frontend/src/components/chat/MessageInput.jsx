import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * MessageInput Component
 *
 * Input field for sending messages to AI
 * - Character counter (max 5000)
 * - Model selector dropdown
 * - Send button with loading state
 * - RTL support for Arabic
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
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

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setModel(newModel);
    onModelChange(newModel);
  };

  return (
    <div
      className={`p-4 border-t border-[var(--border)] bg-gradient-to-t from-[var(--surface)] to-transparent ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Model Selector */}
      <div className={`mb-3 flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <label
          htmlFor="model-select"
          className="text-xs text-[var(--muted)] uppercase tracking-wider self-center"
        >
          {t("chat:model")}
        </label>
        <select
          id="model-select"
          value={model}
          onChange={handleModelChange}
          disabled={disabled || loading}
          className={`px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-md text-sm text-[var(--paper)] focus:outline-none focus:border-[var(--volt)] transition-colors disabled:opacity-50 ${isRTL ? "text-right" : ""}`}
        >
          <option value="deepseek">DeepSeek</option>
          <option value="llama3">LLaMA 3</option>
          <option value="mistral">Mistral</option>
        </select>
      </div>

      {/* Message Input Area */}
      <div className={`relative flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat:message-placeholder") || "Type your message..."}
          disabled={disabled || loading}
          className={`flex-1 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--paper)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--volt)] focus:ring-1 focus:ring-[var(--volt)]/30 resize-none transition-colors disabled:opacity-50 max-h-[150px] overflow-y-auto ${isRTL ? "text-right" : ""}`}
          rows="1"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || loading || !message.trim() || isOverLimit}
          aria-label={t("chat:send") || "Send"}
          className={`px-4 py-3 bg-[var(--volt)] text-[var(--ink)] font-600 rounded-lg hover:bg-[var(--volt)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end flex items-center justify-center gap-2 whitespace-nowrap ${loading ? "animate-pulse" : ""}`}
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
              {t("chat:sending") || "Sending..."}
            </>
          ) : (
            t("chat:send") || "Send"
          )}
        </button>
      </div>

      {/* Character Counter */}
      <div
        className={`mt-2 text-xs flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <span
          className={
            isOverLimit ? "text-[var(--spark)]" : "text-[var(--muted)]"
          }
        >
          {charCount} / {MAX_LENGTH}
        </span>
        {isOverLimit && (
          <span className="text-[var(--spark)]">
            {t("chat:message-too-long") || "Message too long"}
          </span>
        )}
      </div>
    </div>
  );
};
