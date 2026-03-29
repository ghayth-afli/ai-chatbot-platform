import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";

/**
 * Navbar Component
 * Fixed navigation bar with language toggle, auth buttons, and mobile menu
 */
export default function Navbar({
  scrolled,
  mobileMenuOpen,
  onMobileMenuToggle,
  onMobileMenuClose,
  onNavigateChat,
}) {
  const { t, i18n } = useTranslation();

  const handleLanguageToggle = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.navInner}>
          {/* Logo */}
          <a href="/" className={styles.navLogo}>
            nexus<span className={styles.dot}>.</span>
            <span className={styles.badge}>AI</span>
          </a>

          {/* Desktop Links */}
          <ul className={styles.navLinks}>
            <li>
              <a href="#features">{t("nav_feat")}</a>
            </li>
            <li>
              <a href="#models">{t("nav_mod")}</a>
            </li>
            <li>
              <a href="#about">{t("nav_about")}</a>
            </li>
          </ul>

          {/* Right Section: Language Toggle + Buttons */}
          <div className={styles.navRight}>
            <div className={styles.langToggle}>
              <button
                className={`${styles.langBtn} ${i18n.language === "en" ? styles.active : ""}`}
                onClick={() => handleLanguageToggle("en")}
              >
                EN
              </button>
              <button
                className={`${styles.langBtn} ${i18n.language === "ar" ? styles.active : ""}`}
                onClick={() => handleLanguageToggle("ar")}
              >
                عر
              </button>
            </div>
            <a href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
              {t("nav_signin")}
            </a>
            <a
              href="/chat"
              onClick={(e) => {
                e.preventDefault();
                onNavigateChat();
              }}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {t("nav_start")}
            </a>

            {/* Hamburger Menu */}
            <button
              className={`${styles.hamburger} ${mobileMenuOpen ? styles.open : ""}`}
              onClick={onMobileMenuToggle}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${styles.mobMenu} ${mobileMenuOpen ? styles.open : ""}`}>
        <a href="#features" onClick={onMobileMenuClose}>
          {t("nav_feat")}
        </a>
        <a href="#models" onClick={onMobileMenuClose}>
          {t("nav_mod")}
        </a>
        <a href="#about" onClick={onMobileMenuClose}>
          {t("nav_about")}
        </a>
        <div className={styles.mobBtns}>
          <a href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
            {t("nav_signin")}
          </a>
          <a
            href="/chat"
            onClick={(e) => {
              e.preventDefault();
              onMobileMenuClose();
              onNavigateChat();
            }}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            {t("nav_start")}
          </a>
        </div>
      </div>
    </>
  );
}
