import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguageFilter } from "../../hooks/useLanguageFilter";
import styles from "./HistoryPage.module.css";

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    messages,
    counts,
    language,
    setLanguage,
    loading,
    error,
    pagination,
    nextPage,
    prevPage,
    refresh,
  } = useLanguageFilter("all", { limit: 12 });

  const safeCounts = useMemo(
    () => counts || { all: 0, en: 0, ar: 0 },
    [counts],
  );

  const tabs = useMemo(
    () => [
      {
        key: "all",
        label: t("chat.history_all", "All Conversations"),
        count: safeCounts.all,
      },
      {
        key: "en",
        label: t("chat.history_en", "English"),
        count: safeCounts.en,
      },
      {
        key: "ar",
        label: t("chat.history_ar", "Arabic"),
        count: safeCounts.ar,
      },
    ],
    [safeCounts, t],
  );

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [i18n.language],
  );

  const visibleCount =
    language === "all" ? safeCounts.all : safeCounts[language] || 0;
  const hasMessages = messages.length > 0;

  const renderSkeletons = () =>
    Array.from({ length: 4 }).map((_, idx) => (
      <div key={`skeleton-${idx}`} className={styles.skeleton} />
    ));

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <h3>{t("chat.history_empty_title", "No conversations yet")}</h3>
      <p>
        {t(
          "chat.history_empty_subtitle",
          "Start a chat to see it appear here.",
        )}
      </p>
    </div>
  );

  const renderMessageCard = (message) => {
    const content = message.content || "";
    const preview = content.slice(0, 220);
    const truncated = content.length > 220;

    return (
      <article key={message.id} className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.sessionTitle}>{message.session_title}</h3>
          <span className={styles.languageBadge}>
            {message.language_tag === "ar"
              ? t("chat.history_ar", "Arabic")
              : t("chat.history_en", "English")}
          </span>
        </div>
        <p className={styles.snippet}>
          {preview}
          {truncated ? "…" : ""}
        </p>
        <div className={styles.metaRow}>
          <span>{message.role === "assistant" ? t("ai_label") : t("you")}</span>
          {message.model && <span>{message.model}</span>}
          <span>{formatter.format(new Date(message.created_at))}</span>
        </div>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.jumpBtn}
            onClick={() =>
              navigate(
                message.session_id ? `/chat/${message.session_id}` : "/chat",
              )
            }
          >
            {t("chat.history_open", "Open session")}
          </button>
        </div>
      </article>
    );
  };

  const pagLimit = pagination?.limit ?? 0;
  const pagOffset = pagination?.offset ?? 0;
  const pagTotal = pagination?.total ?? 0;

  const currentPage = pagLimit > 0 ? Math.floor(pagOffset / pagLimit) + 1 : 1;
  const totalPages =
    pagLimit > 0 ? Math.max(1, Math.ceil(pagTotal / pagLimit)) : 1;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>
            {t("chat.history_eyebrow", "Timeline Intelligence")}
          </div>
          <h1 className={styles.heroTitle}>
            {t("chat.history_title", "Language-filtered conversation history")}
          </h1>
          <p className={styles.heroSubtitle}>
            {t(
              "chat.history_subtitle",
              "Zoom into English or Arabic conversations instantly, surface patterns, and jump back into any thread in seconds.",
            )}
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              {t("chat.history_stat_total", "Total Conversations")}
            </span>
            <span className={styles.statValue}>{safeCounts.all}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              {t("chat.history_stat_language", "Active Language")}
            </span>
            <span className={styles.statValue}>
              {language === "all"
                ? t("chat.history_all", "All")
                : language.toUpperCase()}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              {t("chat.history_stat_user", "Signed in")}
            </span>
            <span className={styles.statValue}>
              {user?.first_name || user?.email || "—"}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.filterBar}>
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={styles.tabButton}
                data-active={language === tab.key}
                onClick={() => setLanguage(tab.key)}
              >
                <span>{tab.label}</span>
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className={styles.filterMeta}>
            <span>
              {t("chat.history_count", {
                count: visibleCount,
                defaultValue: `${visibleCount} conversations`,
              })}
            </span>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={refresh}
            >
              {t("common.retry")}
            </button>
          </div>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.cardsGrid}>
          {loading && renderSkeletons()}
          {!loading && hasMessages && messages.map(renderMessageCard)}
          {!loading && !hasMessages && renderEmptyState()}
        </div>

        {hasMessages && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={pagOffset === 0 || loading}
              onClick={prevPage}
            >
              {t("chat.history_prev", "Previous")}
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={pagOffset + pagLimit >= pagTotal || loading}
              onClick={nextPage}
            >
              {t("chat.history_next", "Next")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
