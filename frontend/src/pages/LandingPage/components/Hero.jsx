import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useState } from "react";
import styles from "./Hero.module.css";

/**
 * Hero Section Component
 * Main call-to-action section with large title, chat card preview, and action buttons
 */
export default function Hero({ onNavigateChat }) {
  const { t } = useTranslation();

  return (
    <section className={styles.hero} id="hero">
      <div className={styles.heroBg}></div>
      <div className={styles.heroGrid}></div>

      <div className={styles.heroInner}>
        {/* Left Column: Text Content */}
        <div className={styles.heroLeft}>
          <div className={styles.heroEyebrow}>
            <span className={styles.liveDot}></span>
            <span>{t("hero_eye")}</span>
          </div>

          <h1 className={styles.heroTitle}>
            nexus<span className={styles.dot}>.</span>
            <span className={styles.sub}>{t("hero_sub")}</span>
          </h1>

          <p className={styles.heroBody}>{t("hero_body")}</p>

          <div className={styles.heroCta}>
            <button
              onClick={onNavigateChat}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {t("hero_cta1")}
            </button>
            <a
              href="#features"
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              {t("hero_cta2")}
            </a>
          </div>

          <div className={styles.heroChips}>
            <span className={`${styles.chip} ${styles.chipV}`}>Nemotron</span>
            <span className={`${styles.chip} ${styles.chipP}`}>Liquid</span>
            <span className={`${styles.chip} ${styles.chipI}`}>Trinity</span>
            <span className={styles.chip}>{t("chip_lang")}</span>
            <span className={styles.chip}>{t("chip_hist")}</span>
          </div>
        </div>

        {/* Right Column: Chat Card Demo */}
        <div className={styles.heroRight}>
          <ChatCardPreview />
        </div>
      </div>
    </section>
  );
}

/**
 * Chat Card Preview - Interactive demo shown in hero section
 */
function ChatCardPreview() {
  const { t } = useTranslation();
  const [activeModel, setActiveModel] = useState("Nemotron");

  const models = [
    { name: "Nemotron", label: "deepseek", color: "var(--volt)" },
    { name: "Liquid", label: "llama3", color: "var(--plasma)" },
    { name: "Trinity", label: "mistral", color: "var(--ice)" },
  ];

  return (
    <div className={styles.chatCard}>
      {/* Chat Card Header */}
      <div className={styles.ccHead}>
        <div className={styles.ccLeft}>
          <div className={styles.ccDot}></div>
          <span className={styles.ccModel}>{activeModel}</span>
        </div>
        <div className={styles.mswRow}>
          {models.map((model) => (
            <button
              key={model.name}
              className={`${styles.msw} ${activeModel === model.name ? styles.on : ""}`}
              onClick={() => setActiveModel(model.name)}
            >
              {model.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className={styles.ccMsgs}>
        <div className={`${styles.bbl} ${styles.ai}`}>
          <span className={styles.mTag}>{activeModel}</span>
          <div className={styles.bblTxt}>{t("c_ai1")}</div>
        </div>
        <div className={`${styles.bbl} ${styles.usr}`}>
          <div className={styles.bblTxt}>{t("c_u1")}</div>
        </div>
        <div className={`${styles.bbl} ${styles.ai}`}>
          <span className={styles.mTag}>{activeModel}</span>
          <div className={styles.bblTxt}>{t("c_ai2")}</div>
        </div>
      </div>

      {/* Input Row */}
      <div className={styles.ccInpRow}>
        <div className={styles.ccInp}>{t("c_ph")}</div>
        <div className={styles.ccSend}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7H12M12 7L8 3M12 7L8 11"
              stroke="#0D0D12"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
