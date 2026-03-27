import React from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../hooks/useLanguage";

/**
 * Bilingual Component
 *
 * Showcases the bilingual capabilities with:
 * - English interface sample
 * - Arabic interface sample (with RTL support)
 * - RTL layout explanation
 *
 * Demonstrates chat bubble UI elements and language toggling.
 */
const Bilingual = () => {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8">
      {/* Section Title */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs sm:text-sm uppercase tracking-widest text-muted mb-4">
          ── Translate Everything ──
        </p>
        <h2 className="font-['Syne'] font-black text-4xl sm:text-5xl lg:text-6xl text-paper mb-4">
          {t("bilingual.title")}
        </h2>
      </div>

      {/* Showcase Grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 ${isArabic ? "md:grid-flow-col-dense" : ""}`}
      >
        {/* English Showcase */}
        <div className="p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl border border-ice/40 bg-ice/5">
          <p className="font-mono text-xs uppercase tracking-widest text-ice mb-4">
            {t("bilingual.english.heading")}
          </p>

          {/* Chat bubbles */}
          <div className="space-y-4 mb-6">
            {/* AI message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-plasma/20 flex-shrink-0" />
              <div className="px-4 py-3 rounded-lg rounded-bl-none bg-glass border border-border text-paper/80 max-w-xs">
                <p className="text-sm">{t("bilingual.english.sample")}</p>
                <p className="text-xs text-plasma mt-2">DeepSeek Chat</p>
              </div>
            </div>

            {/* User message */}
            <div className="flex gap-3 justify-end">
              <div className="px-4 py-3 rounded-lg rounded-br-none bg-volt text-ink max-w-xs">
                <p className="text-sm font-medium">
                  {t("bilingual.english.sample")}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-volt/20 flex-shrink-0" />
            </div>
          </div>

          <p className="text-xs text-paper/50 font-mono uppercase tracking-wider">
            ← → Seamless Language Support
          </p>
        </div>

        {/* Arabic Showcase */}
        <div
          className="p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl border border-spark/40 bg-spark/5"
          dir="rtl"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-spark mb-4">
            {t("bilingual.arabic.heading")}
          </p>

          {/* Chat bubbles (mirrored) */}
          <div className="space-y-4 mb-6">
            {/* AI message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-plasma/20 flex-shrink-0" />
              <div className="px-4 py-3 rounded-lg rounded-bl-none bg-glass border border-border text-paper/80 max-w-xs font-['Noto_Kufi_Arabic']">
                <p className="text-sm">{t("bilingual.arabic.sample")}</p>
                <p className="text-xs text-plasma mt-2">LLaMA 3</p>
              </div>
            </div>

            {/* User message */}
            <div className="flex gap-3 justify-end">
              <div className="px-4 py-3 rounded-lg rounded-br-none bg-spark text-ink max-w-xs font-['Noto_Kufi_Arabic']">
                <p className="text-sm font-medium">
                  {t("bilingual.arabic.sample")}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-spark/20 flex-shrink-0" />
            </div>
          </div>

          <p className="text-xs text-paper/50 font-mono uppercase tracking-wider">
            دعم اللغة العربية الكامل ←→
          </p>
        </div>
      </div>

      {/* RTL Information */}
      <div className="mt-8 sm:mt-12 p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl border border-border bg-surface">
        <div className="flex gap-3 sm:gap-4 items-start">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-ice/20 text-ice flex items-center justify-center flex-shrink-0 text-base sm:text-lg">
            🔄
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-paper mb-2">
              {t("bilingual.rtl.heading")}
            </h3>
            <p className="text-paper/70 leading-relaxed">
              {t("bilingual.rtl.body")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bilingual;
