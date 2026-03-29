import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./MessagesArea.module.css";

/**
 * MessagesArea Component
 * Displays chat messages with welcome screen, user/AI messages, and typing indicator
 */
export default function MessagesArea({ messages, isLoading }) {
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const suggestions = [
    { icon: "💡", titleKey: "sug1_t", descKey: "sug1_d" },
    { icon: "✍️", titleKey: "sug2_t", descKey: "sug2_d" },
    { icon: "💻", titleKey: "sug3_t", descKey: "sug3_d" },
    { icon: "🌐", titleKey: "sug4_t", descKey: "sug4_d" },
  ];

  return (
    <div className={styles.messagesWrap}>
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
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.msg} ${styles[msg.role]}`}>
                <div className={styles.msgAvatar}>
                  {msg.role === "user" ? "👤" : "🤖"}
                </div>
                <div className={styles.msgBody}>
                  <div className={styles.msgMeta}>
                    {msg.role === "user"
                      ? t("you")
                      : `${t("ai_label")} · ${msg.model}`}
                  </div>
                  <div className={styles.msgBubble}>{msg.content}</div>
                  <div className={styles.msgActions}>
                    <button className={styles.msgActBtn}>{t("copy")}</button>
                    {msg.role === "ai" && (
                      <button className={styles.msgActBtn}>
                        {t("regenerate")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

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
