import { useTranslation } from "react-i18next";
import styles from "./ProfilePanel.module.css";

/**
 * ProfilePanel Component
 * Slide-out panel showing user profile info, stats, preferences, and logout
 */
export default function ProfilePanel({ isOpen, onClose, user }) {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <div className={`${styles.profilePanel} ${isOpen ? styles.open : ""}`}>
      {/* Header */}
      <div className={styles.ppHead}>
        <span className={styles.ppTitle}>{t("profile_title")}</span>
        <button
          className={styles.ppClose}
          onClick={onClose}
          title="Close profile"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className={styles.ppBody}>
        {/* Avatar */}
        <div className={styles.ppAvatarBig}>{user.name?.charAt(0) || "A"}</div>

        {/* Name & Email */}
        <div className={styles.ppName}>{user.name || "Alex Johnson"}</div>
        <div className={styles.ppEmail}>{user.email || "alex@example.com"}</div>

        {/* Stats Row */}
        <div className={styles.ppStatRow}>
          <div className={styles.ppStat}>
            <div className={styles.ppStatN}>12</div>
            <div className={styles.ppStatL}>{t("stat_chats")}</div>
          </div>
          <div className={styles.ppStat}>
            <div className={styles.ppStatN}>84</div>
            <div className={styles.ppStatL}>{t("stat_msgs")}</div>
          </div>
          <div className={styles.ppStat}>
            <div className={styles.ppStatN}>3</div>
            <div className={styles.ppStatL}>{t("stat_models")}</div>
          </div>
        </div>

        {/* AI Summary Card */}
        <div className={styles.ppCard}>
          <div className={styles.ppCardLabel}>
            <span className={styles.pulse}></span>
            <span>{t("ai_summary_label")}</span>
          </div>
          <div className={styles.ppCardText}>{t("summary_en")}</div>
        </div>

        {/* Preferences Card */}
        <div className={styles.ppCard}>
          <div className={styles.ppCardLabel}>{t("preferences")}</div>
          <div className={styles.ppPref}>
            <div className={styles.ppPrefRow}>
              <span className={styles.ppPrefLabel}>{t("pref_lang")}</span>
              <span className={styles.ppPrefVal}>{t("pref_lang_val_en")}</span>
            </div>
            <div className={styles.ppPrefRow}>
              <span className={styles.ppPrefLabel}>{t("pref_model")}</span>
              <span className={styles.ppPrefVal}>deepseek-chat</span>
            </div>
            <div className={styles.ppPrefRow}>
              <span className={styles.ppPrefLabel}>{t("pref_plan")}</span>
              <span className={`${styles.ppPrefVal} ${styles.pro}`}>PRO</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button className={styles.ppLogout}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M9 4l3 2.5-3 2.5M6 6.5h6M7.5 2H2.5A.5.5 0 002 2.5v8a.5.5 0 00.5.5h5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}
