import { useTranslation } from "react-i18next";
import styles from "./Footer.module.css";

/**
 * Footer Component
 * Simple footer with logo, metadata, and language info
 */
export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.footIn}>
        <div className={styles.footLogo}>
          nexus<span className={styles.dot}>.</span>
        </div>
        <div className={styles.footMeta}>{t("foot")}</div>
        <div className={styles.footR}>AI · EN · عر</div>
      </div>
    </footer>
  );
}
