import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Sidebar.module.css";

/**
 * Sidebar Component
 * Displays: Logo, new chat button, user profile card, ai summary, search, chat history, and footer actions
 */
export default function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onOpenProfile,
  onNewChat,
  canCreateNewChat = true,
  onToggleCollapse,
  chatHistory,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onExportChat = null,
  exportDisabled = false,
  exportLoading = false,
  user,
}) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportLanguage, setExportLanguage] = useState("en");
  const exportWrapperRef = useRef(null);

  useEffect(() => {
    setExportMenuOpen(false);
  }, [currentChatId]);

  useEffect(() => {
    if (!exportMenuOpen) {
      return undefined;
    }

    const handleClick = (event) => {
      if (
        exportWrapperRef.current &&
        !exportWrapperRef.current.contains(event.target)
      ) {
        setExportMenuOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [exportMenuOpen]);

  const exportButtonDisabled = exportDisabled || !currentChatId;

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const handleCollapseClick = () => {
    // On mobile, also close the sidebar when collapsing
    onToggleCollapse();
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const handleExportSubmit = async () => {
    if (!onExportChat || exportButtonDisabled) {
      return;
    }

    await onExportChat({ format: exportFormat, language: exportLanguage });
    setExportMenuOpen(false);
  };

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "ar", label: "العربية" },
  ];

  const formatOptions = [
    { value: "pdf", label: "PDF" },
    { value: "text", label: t("text", "Text") },
  ];

  const exportButtonLabel = useMemo(() => {
    if (exportLoading) {
      return t("exporting", "Exporting…");
    }
    return exportFormat === "pdf"
      ? t("download_pdf", "Download PDF")
      : t("download_text", "Download Text");
  }, [exportFormat, exportLoading, t]);

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.mobOpen : ""} ${isCollapsed ? styles.collapsed : ""}`}
    >
      {/* Sidebar Header */}
      <div className={styles.sidebarHead}>
        <a href="/" className={styles.logo}>
          nexus<span className={styles.dot}>.</span>
          <span className={styles.badge}>AI</span>
        </a>
        <div className={styles.headerBtns}>
          <button
            className={styles.newChatBtn}
            onClick={onNewChat}
            title={
              canCreateNewChat
                ? "New Chat"
                : "Finish current chat to create new"
            }
            disabled={!canCreateNewChat}
            aria-disabled={!canCreateNewChat}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 2v10M2 7h10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            className={styles.collapseBtn}
            onClick={handleCollapseClick}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M10 3L4 7l6 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M4 3l6 4-6 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* User Card */}
      {user && (
        <div className={styles.userCard} onClick={onOpenProfile}>
          <div className={styles.userCardInner}>
            <div className={styles.avatar}>
              {(
                user.first_name?.charAt(0) ||
                user.email?.charAt(0) ||
                "A"
              ).toUpperCase()}
            </div>
            <div>
              <div className={styles.userName}>
                {[user.first_name, user.last_name]
                  .map((part) => part?.trim())
                  .filter(Boolean)
                  .join(" ") || user.email}
              </div>
              <div className={styles.userSub}>
                {user.title || t("sidebar_sub_en")}
              </div>
            </div>
            <span className={styles.userChevron}>▾</span>
          </div>
        </div>
      )}

      {/* AI Summary */}
      <div className={styles.aiSummary}>
        <div className={styles.summaryTag}>
          <span className={styles.summaryDot}></span>
          <span>{t("summary_label")}</span>
        </div>
        <div className={styles.summaryText}>{t("summary_en")}</div>
      </div>

      {/* Search */}
      <div className={styles.sidebarSearch}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          type="text"
          placeholder="Search chats…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {/* History Label */}
      <div className={styles.historyLabel}>{t("hist_label")}</div>

      {/* History List */}
      <div className={styles.historyList}>
        {filteredHistory.length > 0 ? (
          filteredHistory.map((chat) => (
            <div
              key={chat.id}
              className={`${styles.histItem} ${currentChatId === chat.id ? styles.active : ""}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className={styles.histIcon}>💬</div>
              <div className={styles.histContent}>
                <div className={styles.histTitle}>{chat.title}</div>
                <div className={styles.histMeta}>{chat.model}</div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>{t("no_chats")}</div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.exportWrapper} ref={exportWrapperRef}>
          <button
            className={styles.sfBtn}
            title="Export Chat"
            onClick={() => {
              if (exportButtonDisabled) {
                return;
              }
              setExportMenuOpen((prev) => !prev);
            }}
            disabled={exportButtonDisabled}
          >
            <div className={styles.exportControl}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 1v7M3.5 5l3 3 3-3M1.5 10h10"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{t("export_chat")}</span>
            </div>
          </button>
          {exportMenuOpen && (
            <div className={styles.exportPanel}>
              <div className={styles.exportHeader}>
                <div>
                  <div className={styles.exportTitle}>{t("export_chat")}</div>
                  <div className={styles.exportHint}>
                    {t("export_hint", "Choose format & language")}
                  </div>
                </div>
                <button
                  className={styles.exportClose}
                  type="button"
                  onClick={() => setExportMenuOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.exportSection}>
                <span className={styles.exportLabel}>
                  {t("format", "Format")}
                </span>
                <div className={styles.segmentedControl}>
                  {formatOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.segmentOption} ${exportFormat === opt.value ? styles.segmentOptionActive : ""}`}
                      onClick={() => setExportFormat(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.exportSection}>
                <span className={styles.exportLabel}>
                  {t("language", "Language")}
                </span>
                <div className={styles.segmentedControl}>
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.segmentOption} ${exportLanguage === opt.value ? styles.segmentOptionActive : ""}`}
                      onClick={() => setExportLanguage(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.exportShortcuts}>
                <span>⌘ + ⇧ + E</span>
                <span>{t("instant_export", "Instant export")}</span>
              </div>
              <button
                className={styles.exportSubmit}
                onClick={handleExportSubmit}
                disabled={exportButtonDisabled || exportLoading}
              >
                {exportButtonLabel}
              </button>
            </div>
          )}
        </div>
        <button
          className={styles.sfBtn}
          title={t("settings.label", "Settings")}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle
              cx="6.5"
              cy="6.5"
              r="2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M6.5 1v1M6.5 11v1M1 6.5h1M11 6.5h1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span>{t("settings.label", "Settings")}</span>
        </button>
      </div>
    </aside>
  );
}
