import { useTranslation } from "react-i18next";
import styles from "./Features.module.css";

/**
 * Features Section Component
 * Showcases 6 key platform features in a grid layout
 */
export default function Features() {
  const { t } = useTranslation();

  const features = [
    {
      icon: "🔀",
      titleKey: "f1t",
      descKey: "f1d",
      badgeKey: "f1b",
      color: "v", // volt
    },
    {
      icon: "📚",
      titleKey: "f2t",
      descKey: "f2d",
      badgeKey: "f2b",
      color: "p", // plasma
    },
    {
      icon: "🌐",
      titleKey: "f3t",
      descKey: "f3d",
      badgeKey: "EN / AR",
      color: "i", // ice
    },
    {
      icon: "✦",
      titleKey: "f4t",
      descKey: "f4d",
      badgeKey: "f4b",
      color: "s", // spark
    },
    {
      icon: "⚡",
      titleKey: "f5t",
      descKey: "f5d",
      badgeKey: "f5b",
      color: "v",
    },
    {
      icon: "🔐",
      titleKey: "f6t",
      descKey: "f6d",
      badgeKey: "Auth + JWT",
      color: "p",
    },
  ];

  return (
    <section className={styles.featSec} id="features">
      <div className={styles.secIn}>
        {/* Section Header */}
        <div className={styles.featHead}>
          <div>
            <div className={styles.sTag}>
              <span>{t("f_tag")}</span>
            </div>
            <h2 className={styles.sTitle}>
              {t("f_title")}
              <span className={styles.highlight}>{t("f_title_a")}</span>
            </h2>
          </div>
          <p className={styles.sBody}>{t("f_body")}</p>
        </div>

        {/* Features Grid */}
        <div className={styles.featGrid}>
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Individual Feature Card
 */
function FeatureCard({ feature }) {
  const { t } = useTranslation();

  return (
    <div className={styles.fCard}>
      <div
        className={`${styles.fIco} ${styles[`ico${feature.color.toUpperCase()}`]}`}
      >
        {feature.icon}
      </div>
      <div className={styles.fTitle}>{t(feature.titleKey)}</div>
      <div className={styles.fDesc}>{t(feature.descKey)}</div>
      <span className={styles.fBadge}>{t(feature.badgeKey)}</span>
    </div>
  );
}
