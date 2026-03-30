import React from "react";
import { useTranslation } from "react-i18next";
import "./SummaryCard.css";

/**
 * SummaryCard Component
 *
 * Displays a single summary with:
 * - Summary text
 * - Language badge (en/ar flag)
 * - Generation date formatted
 * - Archive button
 *
 * Props:
 * - summary: { id, summary_text, language_tag, date_generated, archived }
 * - onArchive: callback when archive button clicked
 */
const SummaryCard = ({ summary, onArchive }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`summary-card ${isArabic ? "rtl" : "ltr"}`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="summary-card-header">
        <div className="summary-meta">
          <span className="language-badge">
            {summary.language_tag === "ar" ? "🇸🇦 Arabic" : "🇺🇸 English"}
          </span>
          <span className="date-generated">
            {formatDate(summary.date_generated)}
          </span>
        </div>
        {!summary.archived && (
          <button
            className="archive-btn"
            onClick={() => onArchive?.(summary.id)}
            title={t("summary.archive", "Archive")}
          >
            ✕
          </button>
        )}
      </div>

      <div className="summary-content">
        <p>{summary.summary_text}</p>
      </div>

      {summary.relevance_score && (
        <div className="summary-footer">
          <span className="relevance-score">
            {t("summary.relevance", "Relevance")}:{" "}
            {(summary.relevance_score * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
