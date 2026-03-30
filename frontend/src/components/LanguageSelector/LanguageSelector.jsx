import React from "react";
import { useTranslation } from "react-i18next";
import { useLanguagePreference } from "../../hooks/useLanguagePreference";
import "./LanguageSelector.css";

/**
 * LanguageSelector Component
 *
 * Dropdown for switching between English and Arabic.
 * Integrates with useLanguagePreference hook to sync language across app.
 *
 * Props:
 * - userId: numeric user ID (required for language persistence)
 * - compact: boolean (default: false) - Show compact version with flag only
 * - showLabel: boolean (default: true) - Show "Language" label
 */
const LanguageSelector = ({ userId, compact = false, showLabel = true }) => {
  const { t, i18n } = useTranslation();
  const { language, setLanguage, available, loading, error } =
    useLanguagePreference(userId);

  if (!userId) {
    return null;
  }

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
  };

  return (
    <div className={`language-selector ${compact ? "compact" : "full"}`}>
      {showLabel && !compact && (
        <label htmlFor="language-select" className="language-label">
          {t("settings.language", "Language")}:
        </label>
      )}

      <select
        id="language-select"
        className="language-dropdown"
        value={language}
        onChange={handleLanguageChange}
        disabled={loading}
        aria-label={t("settings.language", "Language")}
      >
        {available.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {compact ? lang.flag : `${lang.flag} ${lang.label}`}
          </option>
        ))}
      </select>

      {error && (
        <div className="language-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
