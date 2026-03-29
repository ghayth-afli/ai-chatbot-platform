/**
 * MessageInput Component
 *
 * Nexus design - Features:
 * - Model selector with custom pills
 * - Glassmorphic input area
 * - Quick action buttons
 * - Character counter with visual feedback
 * - RTL support
 */

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./MessageInput.module.css";

export const MessageInput = ({
  onSendMessage,
  onModelChange,
  selectedModel = "nemotron",
  disabled = false,
  loading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState("");
  const [model, setModel] = useState(selectedModel);
  const textareaRef = useRef(null);
  const isRTL = i18n.language === "ar";

  const MAX_LENGTH = 4000;
  const charCount = message.length;
  const isOverLimit = charCount > MAX_LENGTH;

  const models = [
    {
      id: "nemotron",
      name: "Nemotron",
      icon: "🚀",
      desc: "Reasoning · Code · Analysis",
    },
    {
      id: "liquid",
      name: "Liquid",
      icon: "💧",
      desc: "Fast · Thinking · Inference",
    },
    {
      id: "trinity",
      name: "Trinity",
      icon: "✨",
      desc: "Efficient · Mini · Versatile",
    },
  ];

  const quickActions = [
    { text: "Explain", icon: "📖" },
    { text: "Analyze", icon: "📊" },
    { text: "Refactor", icon: "⚙️" },
    { text: "Debug", icon: "🐛" },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
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

  const handleQuickAction = (actionText) => {
    const newMessage = message
      ? `${message}\n\n${actionText}:`
      : `${actionText}:`;
    setMessage(newMessage);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className={styles.container} dir={isRTL ? "rtl" : "ltr"}>
      <div className={styles.wrap}>
        {/* Quick Actions */}
        <div className={styles.quickActions} id="quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.text}
              className={styles.quickActionPill}
              onClick={() => handleQuickAction(action.text)}
              title={action.text}
            >
              <span className={styles.qaIcon}>{action.icon}</span>
              {action.text}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className={styles.inputBox}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat:askAnything") || "Ask anything…"}
            disabled={disabled || loading}
            className={styles.textarea}
            rows="1"
          />
          <button
            onClick={handleSend}
            disabled={disabled || loading || !message.trim() || isOverLimit}
            aria-label={t("chat:send") || "Send message"}
            className={styles.sendBtn}
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

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.hint}>
            {t("chat:inputHint") || "Shift+Enter for new line"}
          </span>
          <span className={styles.charCount}>
            {charCount} / {MAX_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
};
