import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { models } from "../../data/landingContent";

/**
 * Hero Component
 *
 * Displays the landing page hero section with:
 * - Gradient background with brand colors
 * - Headline and subheadline (translated)
 * - Model chip selection
 * - Primary CTA button
 * - Smooth scroll to features section
 */
const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isArabic } = useLanguage();

  const handleCTA = () => {
    // For MVP, navigate to login
    navigate("/auth/login");
  };

  const handleFeaturesScroll = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 md:py-24 lg:py-32"
      role="region"
      aria-label="Hero section"
    >
      <div className="text-center">
        {/* Wordmark */}
        <div className="mb-8 flex items-end justify-center gap-1">
          <h1 className="font-['Syne'] font-black text-4xl sm:text-5xl md:text-6xl lg:text-8xl leading-tight text-paper tracking-tight">
            {t("hero.headline")}
          </h1>
          <span className="text-volt font-['Syne'] font-black text-4xl sm:text-5xl md:text-6xl lg:text-9xl leading-none mb-2">
            •
          </span>
        </div>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-paper/60 max-w-3xl mx-auto mb-12 font-dm-sans font-light">
          {t("hero.subhead")}
        </p>

        {/* Model Chips */}
        <div
          className={`flex flex-wrap gap-3 justify-center mb-12 ${isArabic ? "flex-row-reverse" : ""}`}
        >
          {models.map((model) => (
            <div
              key={model.modelName}
              className="px-4 py-2 rounded-full bg-glass border border-border text-muted font-mono text-sm uppercase tracking-wider hover:border-volt hover:text-volt transition-colors duration-300"
            >
              {model.modelName}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center ${isArabic ? "flex-row-reverse" : ""}`}
          role="group"
          aria-label="Call-to-action buttons"
        >
          <button
            onClick={handleCTA}
            className="px-8 py-4 bg-volt text-ink font-bold rounded-lg hover:bg-paper active:scale-95 transition-all duration-200 font-syne uppercase tracking-wide text-sm sm:text-base focus:ring-2 focus:ring-offset-2 focus:ring-volt"
            aria-label="Get started with nexus AI platform"
          >
            {t("hero.cta.default")}
          </button>
          <button
            onClick={handleFeaturesScroll}
            className="px-8 py-4 border border-volt text-volt font-bold rounded-lg hover:bg-volt/10 active:scale-95 transition-all duration-200 font-syne uppercase tracking-wide text-sm sm:text-base focus:ring-2 focus:ring-offset-2 focus:ring-volt"
            aria-label="Scroll to features section"
          >
            {t("nav.features")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
