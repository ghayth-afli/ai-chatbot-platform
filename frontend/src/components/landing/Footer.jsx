import React from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../hooks/useLanguage";

/**
 * Footer Component
 *
 * Displays the footer with:
 * - Brand mark and platform label
 * - Footer links
 * - Language indicator
 * - Copyright notice
 * - Optional GitHub link
 */
const Footer = () => {
  const { t } = useTranslation();
  const { locale, isArabic } = useLanguage();

  return (
    <div className="w-full px-4 sm:px-8 py-8 sm:py-12 md:py-16">
      <div
        className={`max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8 ${isArabic ? "md:grid-flow-col-dense" : ""}`}
      >
        {/* Brand Section */}
        <div className={isArabic ? "md:col-start-4" : ""}>
          <div className="flex items-end gap-1 mb-2">
            <span className="font-['Syne'] font-black text-lg sm:text-2xl text-paper">
              {t("footer.brand")}
            </span>
            <span className="text-volt font-bold text-lg sm:text-2xl">•</span>
          </div>
          <p className="text-xs uppercase tracking-widest text-muted">
            {t("footer.platform")}
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <h4 className="font-bold text-paper text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">
            Product
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li>
              <a
                href="#features"
                className="text-paper/60 hover:text-volt transition-colors"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#models"
                className="text-paper/60 hover:text-volt transition-colors"
              >
                Models
              </a>
            </li>
            <li>
              <a
                href="#about"
                className="text-paper/60 hover:text-volt transition-colors"
              >
                About
              </a>
            </li>
          </ul>
        </div>

        {/* Legal Links */}
        <div>
          <h4 className="font-bold text-paper text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">
            Legal
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-paper/60 hover:text-volt transition-colors bg-none border-none cursor-pointer p-0"
              >
                Privacy
              </button>
            </li>
            <li>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-paper/60 hover:text-volt transition-colors bg-none border-none cursor-pointer p-0"
              >
                Terms
              </button>
            </li>
            <li>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-paper/60 hover:text-volt transition-colors bg-none border-none cursor-pointer p-0"
              >
                Cookies
              </button>
            </li>
          </ul>
        </div>

        {/* Social & Language */}
        <div>
          <h4 className="font-bold text-paper text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">
            Connect
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-paper/60 hover:text-volt transition-colors"
              >
                GitHub
              </a>
            </li>
            <li>
              <span className="text-paper/60">
                {t("footer.languageIndicator")}: {locale.toUpperCase()}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Line */}
      <div className="pt-6 sm:pt-8 border-t border-border text-center text-xs text-paper/50 font-mono uppercase tracking-wider">
        {t("footer.copyright")}
      </div>
    </div>
  );
};

export default Footer;
