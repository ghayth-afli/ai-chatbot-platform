import React from "react";
import { useTranslation } from "react-i18next";
import { models } from "../../data/landingContent";

const Models = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8">
      <div className="text-center mb-12">
        <p className="font-mono text-xs sm:text-sm uppercase tracking-widest text-muted mb-4">
          ── Supported by ──
        </p>
        <h2 className="font-['Syne'] font-black text-4xl sm:text-5xl lg:text-6xl text-paper">
          {t("models.title")}
        </h2>
      </div>

      <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-border bg-glass">
        <table className="w-full text-left text-xs sm:text-sm md:text-base">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold text-paper uppercase tracking-wider text-xs">
                {t("models.title")}
              </th>
              <th className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold text-paper uppercase tracking-wider text-xs">
                Provider
              </th>
              <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold text-paper uppercase tracking-wider text-xs">
                Description
              </th>
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold text-paper uppercase tracking-wider text-xs">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr
                key={model.modelName}
                className={`border-b border-border hover:bg-plasma/5 transition-colors duration-200 ${
                  index === models.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-semibold text-paper">
                  {model.modelName}
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-paper/70 text-xs sm:text-sm">
                  {model.provider}
                </td>
                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-paper/70 text-xs sm:text-sm">
                  {t(model.descriptionKey)}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <span className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-volt/20 text-volt">
                    {model.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Models;
