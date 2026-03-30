import { useEffect, useRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MessagesArea.module.css";

/**
 * MessagesArea Component
 * Displays chat messages with welcome screen, user/AI messages, and typing indicator
 */
const markdownComponents = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
};

export default function MessagesArea({ messages, isLoading }) {
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(true);
  const copyTimeoutRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    autoScrollRef.current = distanceFromBottom < 120;
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  const handleCopy = useCallback(async (messageId, content = "") => {
    if (!content) {
      return;
    }

    const writeToClipboard = async (text) => {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        return true;
      } catch (error) {
        console.error("Copy fallback failed", error);
      }
      return false;
    };

    try {
      const success = await writeToClipboard(content);
      if (success) {
        setCopiedId(messageId);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedId(null);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy message", err);
    }
  }, []);

  const suggestions = [
    { icon: "💡", titleKey: "sug1_t", descKey: "sug1_d" },
    { icon: "✍️", titleKey: "sug2_t", descKey: "sug2_d" },
    { icon: "💻", titleKey: "sug3_t", descKey: "sug3_d" },
    { icon: "🌐", titleKey: "sug4_t", descKey: "sug4_d" },
  ];

  return (
    <div
      className={styles.messagesWrap}
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      <div className={styles.messagesInner}>
        {messages.length === 0 ? (
          <div className={styles.welcome}>
            <div className={styles.welcomeLogo}>
              nexus<span className={styles.dot}>.</span>
            </div>
            <div className={styles.welcomeSub}>{t("welcome_sub")}</div>
            <div className={styles.suggestionGrid}>
              {suggestions.map((sug, idx) => (
                <div key={idx} className={styles.sugCard}>
                  <div className={styles.sugIcon}>{sug.icon}</div>
                  <div className={styles.sugTitle}>{t(sug.titleKey)}</div>
                  <div className={styles.sugDesc}>{t(sug.descKey)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const key = msg.id ?? `${msg.role}-${idx}`;
              return (
                <div key={key} className={`${styles.msg} ${styles[msg.role]}`}>
                  <div className={styles.msgAvatar}>
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className={styles.msgBody}>
                    <div className={styles.msgMeta}>
                      {msg.role === "user"
                        ? t("you")
                        : `${t("ai_label")} · ${msg.model}`}
                    </div>
                    <div className={styles.msgBubble}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className={styles.markdown}
                        components={markdownComponents}
                      >
                        {msg.content || ""}
                      </ReactMarkdown>
                    </div>
                    <div className={styles.msgActions}>
                      <button
                        className={styles.msgActBtn}
                        onClick={() => handleCopy(key, msg.content)}
                      >
                        {copiedId === key ? t("copied", "Copied") : t("copy")}
                      </button>
                      {msg.role === "ai" && (
                        <button className={styles.msgActBtn}>
                          {t("regenerate")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className={`${styles.typingMsg}`}>
                <div className={styles.msgAvatar}>🤖</div>
                <div className={styles.msgBody}>
                  <div className={styles.typingBubble}>
                    <span className={styles.td}></span>
                    <span className={styles.td}></span>
                    <span className={styles.td}></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
