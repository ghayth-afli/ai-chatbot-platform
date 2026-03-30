import { useTranslation } from "react-i18next";
import ProfileSummary from "../../../components/ProfileSummary/ProfileSummary";
import styles from "./ProfilePanel.module.css";

/**
 * ProfilePanel Component
 * Slide-out panel showing user profile info, stats, preferences, and logout
 */
export default function ProfilePanel({
  isOpen,
  onClose,
  onLogout = () => {},
  user,
  stats = {},
  preferences = {},
}) {
  const { t } = useTranslation();

  if (!user) return null;

  const fullName = [user.first_name, user.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName = fullName || user.name || user.email || "User";
  const avatarLabel = (displayName.charAt(0) || "A").toUpperCase();
  const email = user.email || "";

  const activeChats = Number(stats.chats ?? 0);
  const totalMessages = Number(stats.messages ?? 0);
  const modelsUsed = Number(stats.models ?? 0);

  const languagePref =
    preferences.language ||
    (user.language_preference === "ar"
      ? t("pref_lang_val_ar")
      : t("pref_lang_val_en"));
  const preferredModel = preferences.model || "—";
  const planStatus = preferences.plan || "Free";
  const isPremiumPlan = planStatus.toLowerCase().includes("pro");

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
        <div className={styles.ppAvatarBig}>{avatarLabel}</div>

        {/* Name & Email */}
        <div className={styles.ppName}>{displayName}</div>
        <div className={styles.ppEmail}>{email}</div>

        {/* Stats Row */}
        <div className={styles.ppStatRow}>
          <div className={styles.ppStat}>
            <div className={styles.ppStatN}>{activeChats}</div>
            <div className={styles.ppStatL}>{t("stat_chats")}</div>
          </div>
          <div className={styles.ppStat}>
            <div className={styles.ppStatN}>{totalMessages}</div>
            <div className={styles.ppStatL}>{t("stat_msgs")}</div>
          </div>
          <div className={styles.ppStat}>
            <div className={styles.ppStatN}>{modelsUsed}</div>
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
              <span className={styles.ppPrefVal}>{languagePref}</span>
            </div>
            <div className={styles.ppPrefRow}>
              <span className={styles.ppPrefLabel}>{t("pref_model")}</span>
              <span className={styles.ppPrefVal}>{preferredModel}</span>
            </div>
            <div className={styles.ppPrefRow}>
              <span className={styles.ppPrefLabel}>{t("pref_plan")}</span>
              <span
                className={`${styles.ppPrefVal} ${isPremiumPlan ? styles.pro : ""}`}
              >
                {planStatus}
              </span>
            </div>
          </div>
        </div>

        {/* AI Summaries Section */}
        {user?.id && (
          <div className={styles.ppSummariesSection}>
            <ProfileSummary
              userId={user.id}
              showLanguageSelector={false}
              activityStats={stats}
            />
          </div>
        )}

        {/* Logout Button */}
        <button className={styles.ppLogout} onClick={onLogout}>
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
