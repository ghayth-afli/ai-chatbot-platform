import { useTranslation } from "react-i18next";
import styles from "./About.module.css";

/**
 * About Section Component
 * Showcases platform philosophy and key features
 */
export default function About() {
  const { t } = useTranslation();

  const features = [
    {
      icon: "🧠",
      titleKey: "ab1t",
      descKey: "ab1d",
    },
    {
      icon: "⚙️",
      titleKey: "ab2t",
      descKey: "ab2d",
    },
    {
      icon: "🌍",
      titleKey: "ab3t",
      descKey: "ab3d",
    },
  ];

  return (
    <section className={styles.aboutSec} id="about">
      <div className={styles.secIn}>
        <div className={styles.aboutLayout}>
          {/* Left Card */}
          <div className={styles.abCard}>
            <div className={styles.abGlow}></div>
            <div className={styles.abWm}>
              nexus<span className={styles.dot}>.</span>
            </div>
            <div className={styles.abQuote}>{t("ab_quote")}</div>
            <div className={styles.abPills}>
              <span className={`${styles.ap} ${styles.apV}`}>{t("ap1")}</span>
              <span className={`${styles.ap} ${styles.apP}`}>{t("ap2")}</span>
              <span className={styles.ap}>{t("ap3")}</span>
              <span className={styles.ap}>{t("ap4")}</span>
            </div>
          </div>

          {/* Right Content */}
          <div className={styles.abContent}>
            <div className={styles.sTag}>
              <span>{t("ab_tag")}</span>
            </div>
            <h2 className={styles.sTitle}>
              {t("ab_title")}
              <span className={styles.highlight}>{t("ab_title_a")}</span>
              {t("ab_title_b")}
            </h2>
            <p className={styles.sBody}>{t("ab_body")}</p>

            <div className={styles.abFeats}>
              {features.map((feat, idx) => (
                <div key={idx} className={styles.abFeat}>
                  <div className={styles.abIco}>{feat.icon}</div>
                  <div>
                    <div className={styles.abFt}>{t(feat.titleKey)}</div>
                    <div className={styles.abFd}>{t(feat.descKey)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
