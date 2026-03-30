import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserSummaries } from "../../hooks/useUserSummaries";
import { useLanguagePreference } from "../../hooks/useLanguagePreference";
import SummaryCard from "./SummaryCard";
import "./ProfileSummary.css";

/**
 * ProfileSummary Component
 *
 * Main profile summaries display component showing:
 * - Language preference selector
 * - Loading spinner
 * - Error message
 * - Empty state message
 * - List of summary cards with pagination
 *
 * Props:
 * - userId: numeric user ID (required)
 * - showLanguageSelector: boolean (default: true)
 */
const ProfileSummary = ({ userId, showLanguageSelector = true }) => {
  const { t, i18n } = useTranslation();
  const { summaries, loading, error, refetch } = useUserSummaries(userId);
  const { language, setLanguage, available } = useLanguagePreference(userId);
  const [archivedItems, setArchivedItems] = useState(new Set());
  const isArabic = i18n.language === "ar";

  const handleArchive = async (summaryId) => {
    // Mark as archived locally
    setArchivedItems((prev) => new Set(prev).add(summaryId));

    // In a future phase, this would call an archive endpoint
    // For now, it's just UI feedback
    console.log("Summary archived:", summaryId);
  };

  const activeSummaries = summaries.filter(
    (summary) => !archivedItems.has(summary.id) && !summary.archived,
  );

  return (
    <div
      className={`profile-summary ${isArabic ? "rtl" : "ltr"}`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="profile-summary-container">
        {/* Header Section */}
        <div className="profile-summary-header">
          <div className="header-title">
            <h2>{t("profile.summary_title", "Your Interaction Summary")}</h2>
            <p className="subtitle">
              {t(
                "profile.summary_subtitle",
                "Quick insights into your chat patterns",
              )}
            </p>
          </div>

          {showLanguageSelector && (
            <div className="language-selector">
              <label>{t("settings.language", "Language")}:</label>
              <div className="language-options">
                {available.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${language === lang.code ? "active" : ""}`}
                    onClick={() => setLanguage(lang.code)}
                    disabled={language === lang.code}
                    title={lang.label}
                  >
                    <span className="flag">{lang.flag}</span>
                    <span className="label">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="profile-summary-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t("common.loading", "Loading summaries...")}</p>
            </div>
          )}

          {error && !loading && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p className="error-message">{error}</p>
              <button className="retry-btn" onClick={refetch}>
                {t("common.retry", "Try Again")}
              </button>
            </div>
          )}

          {!loading && !error && activeSummaries.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p className="empty-message">
                {t(
                  "profile.no_summaries",
                  "No summaries available yet. Start chatting to see your interaction patterns!",
                )}
              </p>
            </div>
          )}

          {!loading && !error && activeSummaries.length > 0 && (
            <div className="summaries-list">
              <div className="summaries-count">
                {t("profile.summaries_count", "{{count}} summaries", {
                  count: activeSummaries.length,
                })}
              </div>
              {activeSummaries.map((summary) => (
                <SummaryCard
                  key={summary.id}
                  summary={summary}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with pagination info (if needed) */}
        {!loading && activeSummaries.length > 0 && (
          <div className="profile-summary-footer">
            <p className="footer-note">
              {t(
                "profile.summaries_note",
                "Summaries are updated automatically as you chat",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSummary;
