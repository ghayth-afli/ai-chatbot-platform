import { useTranslation } from "react-i18next";
import styles from "./CTA.module.css";

/**
 * CTA Section Component
 * Final call-to-action section with signup and login buttons
 */
export default function CTA({ onNavigateChat }) {
  const { t } = useTranslation();

  return (
    <section className={styles.ctaSec}>
      <div className={styles.ctaBg}></div>
      <div className={styles.ctaIn}>
        <div className={styles.ctaEye}>{t("cta_eye")}</div>
        <h2 className={styles.ctaTtl}>
          {t("cta_title")}
          <span className={styles.highlightPlasma}>{t("cta_title_a")}</span>
        </h2>
        <p className={styles.ctaSub}>{t("cta_sub")}</p>
        <div className={styles.ctaBtns}>
          <button className={`${styles.btn} ${styles.btnCp}`}>
            {t("cta_b1")}
          </button>
          <button className={`${styles.btn} ${styles.btnCg}`}>
            {t("cta_b2")}
          </button>
        </div>
      </div>
    </section>
  );
}
