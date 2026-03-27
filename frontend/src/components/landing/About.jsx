import React from "react";
import { useTranslation } from "react-i18next";

/**
 * About Component
 *
 * Displays the about section with:
 * - Section title
 * - Multi-paragraph body text
 * - Brand positioning and vision
 */
const About = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8">
      {/* Section Title */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs sm:text-sm uppercase tracking-widest text-muted mb-4">
          ── Who We Are ──
        </p>
        <h2 className="font-['Syne'] font-black text-4xl sm:text-5xl lg:text-6xl text-paper">
          {t("about.title")}
        </h2>
      </div>

      {/* Body Content */}
      <div className="space-y-6 sm:space-y-8">
        {t("about.body", { returnObjects: true }).map((paragraph, index) => (
          <p
            key={index}
            className="text-base sm:text-lg text-paper/80 font-light leading-relaxed"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Brand Values */}
      <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 rounded-lg border border-volt/30 bg-volt/5">
          <div className="text-xl sm:text-2xl font-bold text-volt mb-2">01</div>
          <h3 className="font-bold text-sm sm:text-base text-paper mb-2">
            Choice
          </h3>
          <p className="text-xs sm:text-sm text-paper/60">
            Multiple models, multiple languages, multiple possibilities.
          </p>
        </div>
        <div className="p-4 sm:p-6 rounded-lg border border-plasma/30 bg-plasma/5">
          <div className="text-xl sm:text-2xl font-bold text-plasma mb-2">
            02
          </div>
          <h3 className="font-bold text-sm sm:text-base text-paper mb-2">
            Transparency
          </h3>
          <p className="text-xs sm:text-sm text-paper/60">
            Open-source models with clear provider attribution.
          </p>
        </div>
        <div className="p-4 sm:p-6 rounded-lg border border-ice/30 bg-ice/5">
          <div className="text-xl sm:text-2xl font-bold text-ice mb-2">03</div>
          <h3 className="font-bold text-sm sm:text-base text-paper mb-2">
            Accessibility
          </h3>
          <p className="text-xs sm:text-sm text-paper/60">
            Bilingual by default. For everyone, everywhere.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
