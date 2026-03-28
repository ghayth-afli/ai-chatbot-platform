import React from "react";
import { useTranslation } from "react-i18next";
import { features } from "../../data/landingContent";
import { useLanguage } from "../../hooks/useLanguage";

/**
 * Features Component
 *
 * Displays a 5-card grid of landing page features:
 * - Multi-Model Chat
 * - Chat History
 * - Bilingual Support
 * - Smart Summaries
 * - Model Switching
 *
 * Each card has an icon placeholder, title, body, and accent color.
 */
const Features = () => {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();

  const accentColorMap = {
    volt: "text-volt",
    plasma: "text-plasma",
    spark: "text-spark",
    ice: "text-ice",
  };

  const accentBgMap = {
    volt: "bg-volt/10",
    plasma: "bg-plasma/10",
    spark: "bg-spark/10",
    ice: "bg-ice/10",
  };

  // ✅ FIX: Static border color classes (Tailwind requires static strings)
  const accentBorderMap = {
    volt: "hover:border-volt",
    plasma: "hover:border-plasma",
    spark: "hover:border-spark",
    ice: "hover:border-ice",
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8">
      {/* Section Title */}
      <div className="text-center mb-16">
        <p className="font-mono text-xs sm:text-sm uppercase tracking-widest text-muted mb-4">
          ── capabilities ──
        </p>
        <h2 className="font-['Syne'] font-black text-4xl sm:text-5xl lg:text-6xl text-paper mb-4">
          {t("features.title")}
        </h2>
      </div>

      {/* Features Grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6 ${isArabic ? "grid-flow-row-dense" : ""}`}
      >
        {features.map((feature) => (
          <div
            key={feature.id}
            className={`p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl border border-border bg-glass transition-all duration-300 group cursor-pointer hover:border-opacity-100 min-h-[220px] sm:min-h-[240px] flex flex-col ${accentBorderMap[feature.accent]}`}
            role="article"
            aria-label={`${t(feature.titleKey)} - ${t(feature.bodyKey)}`}
          >
            {/* Icon Placeholder */}
            <div
              className={`w-12 h-12 rounded-lg ${accentBgMap[feature.accent]} ${accentColorMap[feature.accent]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
            >
              <span className="text-xl font-bold">
                {feature.id[0].toUpperCase()}
              </span>
            </div>

            {/* Title */}
            <h3
              className={`font-bold text-base sm:text-lg text-paper mb-3 ${accentColorMap[feature.accent]}`}
            >
              {t(feature.titleKey)}
            </h3>

            {/* Body */}
            <p className="text-sm sm:text-base text-paper/70 font-light leading-relaxed flex-grow">
              {t(feature.bodyKey)}
            </p>
          </div>
        ))}}
      </div>
    </div>
  );
};

export default Features;
