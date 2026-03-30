import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ChatHeader.module.css";

/**
 * ChatHeader Component
 * Fixed header with model selector, language toggle, and user actions
 */
export default function ChatHeader({
  selectedModel,
  onModelChange,
  onToggleSidebar,
  onToggleCollapse,
  isSidebarCollapsed,
  onOpenProfile,
  onLogout,
}) {
  const { t, i18n } = useTranslation();
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const models = [
    {
      id: "nemotron",
      name: "Nemotron",
      desc: t("m1d"),
      color: "var(--volt)",
    },
    {
      id: "liquid",
      name: "Liquid",
      desc: t("m2d"),
      color: "var(--plasma)",
    },
    {
      id: "trinity",
      name: "Trinity",
      desc: t("m3d"),
      color: "var(--ice)",
    },
  ];

  const handleModelSelect = (modelId) => {
    onModelChange(modelId);
    setModelDropdownOpen(false);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className={styles.chatHeader}>
      <div className={styles.headerLeft}>
        <button
          className={styles.mobToggle}
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12M2 8h12M2 12h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Model Selector */}
        <div className={styles.modelSelectWrap}>
          <div
            className={`${styles.modelSelect} ${modelDropdownOpen ? styles.open : ""}`}
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
          >
            <div
              className={styles.modelDot}
              style={{
                background:
                  models.find((m) => m.id === selectedModel)?.color ||
                  "var(--volt)",
              }}
            ></div>
            <span className={styles.modelNameLabel}>{selectedModel}</span>
            <span className={styles.modelChevron}>▾</span>
          </div>

          {/* Model Dropdown */}
          <div
            className={`${styles.modelDropdown} ${modelDropdownOpen ? styles.open : ""}`}
          >
            {models.map((model) => (
              <div
                key={model.id}
                className={`${styles.modelOpt} ${selectedModel === model.id ? styles.selected : ""}`}
                onClick={() => handleModelSelect(model.id)}
              >
                <div
                  className={styles.modelDot}
                  style={{ background: model.color }}
                ></div>
                <div className={styles.modelOptInfo}>
                  <div className={styles.modelOptName}>{model.name}</div>
                  <div className={styles.modelOptDesc}>{model.desc}</div>
                </div>
                {selectedModel === model.id && (
                  <span className={styles.modelCheck}>✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Collapse Toggle (Desktop only) */}
        <button
          className={styles.collapseToggle}
          onClick={onToggleCollapse}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M11 4L5 8l6 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M5 4l6 4-6 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      <div className={styles.headerRight}>
        {/* Language Toggle */}
        <div className={styles.langTog}>
          <button
            className={`${styles.ltBtn} ${i18n.language === "en" ? styles.on : ""}`}
            onClick={() => handleLanguageChange("en")}
          >
            EN
          </button>
          <button
            className={`${styles.ltBtn} ${i18n.language === "ar" ? styles.on : ""}`}
            onClick={() => handleLanguageChange("ar")}
          >
            عر
          </button>
        </div>

        {/* Logout Button */}
        <button
          className={styles.logoutBtn}
          title="Sign Out"
          onClick={onLogout}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M8 4l3 2-3 2M5 6h6M7 2H2.5A.5.5 0 002 2.5v7a.5.5 0 00.5.5H7"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{t("logout")}</span>
        </button>

        {/* Profile Button */}
        <button
          className={styles.profileBtn}
          onClick={onOpenProfile}
          title="Profile"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle
              cx="6"
              cy="4"
              r="2.5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M1.5 11c0-2.485 2.015-4.5 4.5-4.5S10.5 8.515 10.5 11"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <span>{t("profile")}</span>
        </button>
      </div>
    </header>
  );
}
