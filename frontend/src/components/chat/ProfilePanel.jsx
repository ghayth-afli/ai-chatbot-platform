/**
 * ProfilePanel Component
 *
 * Slides in from the right side showing user profile, stats, and preferences
 * Responsive and supports RTL (Arabic) layout
 */

import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./ProfilePanel.module.css";

export function ProfilePanel({ isOpen, onClose, userProfile, userSummary }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = userProfile?.name || userProfile?.email || "User";
  const userEmail = userProfile?.email || "user@example.com";
  const initials = getInitials(userName);

  // Mock stats (would come from API in real implementation)
  const stats = {
    chats: 12,
    messages: 84,
    models: 3,
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          dir={isRTL ? "rtl" : "ltr"}
        />
      )}

      {/* Panel */}
      <div
        className={`${styles.panel} ${isOpen ? styles.open : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{t("chat:profile") || "My Profile"}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close profile"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Avatar & Name */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarLarge}>{initials}</div>
            <div className={styles.name}>{userName}</div>
            <div className={styles.email}>{userEmail}</div>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.chats}</div>
              <div className={styles.statLabel}>
                {t("chat:chats") || "Chats"}
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.messages}</div>
              <div className={styles.statLabel}>
                {t("chat:messages") || "Messages"}
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.models}</div>
              <div className={styles.statLabel}>
                {t("chat:models") || "Models"}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {userSummary && (
            <div className={styles.card}>
              <div className={styles.cardLabel}>
                <span className={styles.pulse} />
                <span>{t("chat:aiSummary") || "AI-Generated Summary"}</span>
              </div>
              <div className={styles.cardText}>{userSummary}</div>
            </div>
          )}

          {/* Account Info Card */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>
              <span>{t("chat:accountStatus") || "Account Status"}</span>
            </div>
            <div className={styles.cardText}>
              <div className={styles.prefRow}>
                <span className={styles.prefLabel}>
                  {t("chat:plan") || "Plan"}
                </span>
                <span className={styles.prefValue}>PRO</span>
              </div>
              <div className={styles.prefRow}>
                <span className={styles.prefLabel}>
                  {t("chat:joined") || "Joined"}
                </span>
                <span className={styles.prefValue}>2024</span>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>
              {t("chat:preferences") || "Preferences"}
            </div>
            <div className={styles.cardText}>
              <div className={styles.prefRow}>
                <span className={styles.prefLabel}>
                  {t("chat:defaultModel") || "Default Model"}
                </span>
                <span className={styles.prefValue}>Nemotron</span>
              </div>
              <div className={styles.prefRow}>
                <span className={styles.prefLabel}>
                  {t("chat:language") || "Language"}
                </span>
                <span className={styles.prefValue}>
                  {i18n.language === "en" ? "English" : "العربية"}
                </span>
              </div>
              <div className={styles.prefRow}>
                <span className={styles.prefLabel}>
                  {t("chat:theme") || "Theme"}
                </span>
                <span className={styles.prefValue}>Dark</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button className={styles.logoutBtn} onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 4l3 2-3 2M5 6h6M7 2H2.5A.5.5 0 002 2.5v7a.5.5 0 00.5.5H7"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t("chat:signOut") || "Sign Out"}</span>
          </button>
        </div>
      </div>
    </>
  );
}
