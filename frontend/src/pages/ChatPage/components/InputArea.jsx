import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./InputArea.module.css";

/**
 * InputArea Component
 * Textarea input with auto-resize, quick actions, character counter, and send button
 */
export default function InputArea({ onSendMessage, isLoading, disabled }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    autoResize(e.target);
  };

  const autoResize = (textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  };

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = message.length;
  const maxChars = 4000;

  const quickActions = [
    { label: t("qa1"), icon: "✦" },
    { label: t("qa2"), icon: "✦" },
    { label: t("qa3"), icon: "✦" },
    { label: t("qa4"), icon: "✦" },
  ];

  return (
    <div className={styles.inputArea}>
      <div className={styles.inputWrap}>
        {/* Quick Actions - mobile hidden */}
        <div className={styles.quickActions}>
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              className={styles.qaPill}
              onClick={() => {
                setMessage(action.label);
                inputRef.current?.focus();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className={styles.inputBox}>
          <textarea
            ref={inputRef}
            className={styles.chatTextarea}
            rows="1"
            placeholder={t("input_ph")}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
          ></textarea>
          <button
            className={`${styles.sendBtn} ${isLoading ? styles.sendBtnBusy : ""}`}
            onClick={handleSend}
            disabled={disabled || isLoading || !message.trim()}
            title={isLoading ? "AI is responding" : "Send message"}
            aria-label={isLoading ? "AI is responding" : "Send message"}
            aria-live="polite"
          >
            {isLoading ? (
              <span className={styles.sendSpinner} aria-hidden="true"></span>
            ) : (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M2 7.5H13M13 7.5L8.5 3M13 7.5L8.5 12"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Input Footer */}
        <div className={styles.inputFooter}>
          <span className={styles.inputHint}>{t("input_hint")}</span>
          <span className={styles.charCount}>
            {charCount} / {maxChars}
          </span>
        </div>
      </div>
    </div>
  );
}
