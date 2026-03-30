import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Models.module.css";

/**
 * Models Section Component
 * Shows 3 AI models with model selection and stats
 */
export default function Models() {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState("nemotron");

  const models = [
    {
      id: "nemotron",
      name: "Nemotron",
      descKey: "m1d",
      badge: "v",
      color: "var(--volt)",
    },
    {
      id: "liquid",
      name: "Liquid",
      descKey: "m2d",
      badge: "p",
      color: "var(--plasma)",
    },
    {
      id: "trinity",
      name: "Trinity",
      descKey: "m3d",
      badge: "i",
      color: "var(--ice)",
    },
  ];

  return (
    <section className={styles.modSec} id="models">
      <div className={styles.secIn}>
        {/* Section Header */}
        <div className={styles.sTag}>
          <span>{t("m_tag")}</span>
        </div>
        <h2 className={styles.sTitle}>
          {t("m_title")}
          <span className={styles.highlightPlasma}>{t("m_title_a")}</span>
        </h2>
        <p className={styles.sBody}>{t("m_body")}</p>

        {/* Models Layout */}
        <div className={styles.modLayout}>
          {/* Model Cards */}
          <div className={styles.modCards}>
            {models.map((model) => (
              <div
                key={model.id}
                className={`${styles.mCard} ${selectedModel === model.id ? styles.on : ""}`}
                onClick={() => setSelectedModel(model.id)}
              >
                <div
                  className={styles.mDot}
                  style={{ background: model.color }}
                ></div>
                <div>
                  <div className={styles.mName}>{model.name}</div>
                  <div className={styles.mDesc}>{t(model.descKey)}</div>
                </div>
                <span
                  className={`${styles.mBadge} ${styles[`badge${model.badge.toUpperCase()}`]}`}
                >
                  {model.badge}
                </span>
              </div>
            ))}
          </div>

          {/* Model Info Display */}
          <div className={styles.modShow}>
            <div className={styles.msTag}>{t("ms_tag")}</div>
            <div className={styles.msTitle}>{t("ms_title")}</div>
            <div className={styles.msSub}>{t("ms_sub")}</div>

            <div className={styles.pillRow}>
              <div className={`${styles.pill} ${styles.pillV}`}>
                <div className={styles.pl}>NEMOTRON</div>
                <div className={styles.pd}>{t("p1")}</div>
              </div>
              <div className={`${styles.pill} ${styles.pillP}`}>
                <div className={styles.pl}>LIQUID</div>
                <div className={styles.pd}>{t("p2")}</div>
              </div>
              <div className={`${styles.pill} ${styles.pillI}`}>
                <div className={styles.pl}>TRINITY</div>
                <div className={styles.pd}>{t("p3")}</div>
              </div>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statC}>
                <div className={styles.statN}>3</div>
                <div className={styles.statL}>{t("st1")}</div>
              </div>
              <div className={styles.statC}>
                <div className={styles.statN}>2</div>
                <div className={styles.statL}>{t("st2")}</div>
              </div>
              <div className={styles.statC}>
                <div className={styles.statN}>∞</div>
                <div className={styles.statL}>{t("st3")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
