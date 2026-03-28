import React from "react";
import { useTranslation } from "react-i18next";
import { models } from "../../data/landingContent";

const Models = () => {
  const { t } = useTranslation();
  const [isMobileView, setIsMobileView] = React.useState(false);

  // Detect mobile view for responsive layout - match Tailwind breakpoint (640px = sm)
  React.useEffect(() => {
    const checkMobileView = () => {
      // Use 640px to match Tailwind's sm breakpoint
      setIsMobileView(window.innerWidth < 640);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

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

      {/* Mobile: Card Layout | Desktop: Table Layout */}
      {isMobileView ? (
        <div
          className="space-y-3 sm:space-y-4"
          role="list"
          aria-label="Supported AI models"
        >
          {models.map((model, index) => (
            <div
              key={model.modelName}
              className="p-4 sm:p-5 border border-border bg-glass rounded-lg sm:rounded-xl hover:border-volt/50 transition-colors duration-200"
              role="listitem"
              aria-label={`${model.modelName} model by ${model.provider}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-grow">
                  <h3 className="font-semibold text-paper text-sm sm:text-base mb-1">
                    {model.modelName}
                  </h3>
                  <p className="text-xs sm:text-sm text-paper/60">
                    {model.provider}
                  </p>
                </div>
                <span className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-volt/20 text-volt whitespace-nowrap flex-shrink-0">
                  {model.status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-paper/70">
                {t(model.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-border bg-glass">
          <table
            className="w-full text-left text-xs sm:text-sm md:text-base"
            role="table"
            aria-label="Supported AI models comparison"
          >
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
                  role="row"
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
      )}
    </div>
  );
};

export default Models;
