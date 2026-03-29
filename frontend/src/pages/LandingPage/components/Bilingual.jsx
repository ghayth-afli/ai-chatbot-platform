import { useTranslation } from "react-i18next";
import styles from "./Bilingual.module.css";

/**
 * Bilingual Section Component
 * Showcases bilingual support with example text cards in EN and AR
 */
export default function Bilingual() {
  const { t } = useTranslation();

  return (
    <section className={styles.bilSec} id="bilingual">
      <div className={styles.secIn}>
        <div className={styles.sTag}>
          <span>{t("b_tag")}</span>
        </div>
        <h2 className={styles.sTitle}>
          {t("b_title")}
          <span className={styles.highlight}>{t("b_title_a")}</span>
        </h2>

        <div className={styles.bilGrid}>
          {/* English Card */}
          <div className={styles.bilCard}>
            <div className={styles.bilLang}>English</div>
            <div className={styles.bilH}>
              nexus<span>.</span> — where conversations evolve.
            </div>
            <div className={styles.bilSub}>{t("b_ensub")}</div>
            <div className={styles.bilSamp}>
              "Can you help me draft a professional email to my client about the
              project delay?"
            </div>
          </div>

          {/* Arabic Card */}
          <div className={`${styles.bilCard} ${styles.ar}`}>
            <div className={styles.bilLang}>العربية</div>
            <div className={styles.bilH}>
              نكسوس<span>.</span> — حيث تتطور المحادثات.
            </div>
            <div className={styles.bilSub}>
              واجهة عربية كاملة مع تخطيط RTL صحيح. تحدث بلغتك الأم مع أقوى نماذج
              الذكاء الاصطناعي.
            </div>
            <div className={styles.bilSamp}>
              "هل يمكنك مساعدتي في كتابة رسالة احترافية لعميلي بخصوص تأخر
              المشروع؟"
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
