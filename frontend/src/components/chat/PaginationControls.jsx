/**
 * PaginationControls Component
 *
 * Pagination UI for message history:
 * - Previous/Next buttons
 * - Page indicator
 * - Load earlier button
 */

import React from "react";
import { useTranslation } from "react-i18next";

export function PaginationControls({
  currentPage = 1,
  totalPages = 1,
  onPreviousPage,
  onNextPage,
  onLoadEarlier,
  loading = false,
  isRTL = false,
}) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null; // No pagination needed for single page
  }

  return (
    <div
      className={`flex items-center justify-center gap-3 py-4 px-4 border-t border-[var(--border)]/40 bg-[var(--surface)]/20 backdrop-blur-sm ${
        isRTL ? "flex-row-reverse" : ""
      }`}
    >
      {/* Previous Button */}
      <button
        onClick={onPreviousPage}
        disabled={currentPage === 1 || loading}
        className={`
          px-3.5 py-2 bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/40
          rounded-lg hover:bg-[var(--surface)]/80 hover:border-[var(--border)]/60 transition-all
          disabled:opacity-40 disabled:cursor-not-allowed
          text-sm font-600 font-syne text-[var(--paper)]
          active:scale-95 duration-200
        `}
      >
        {isRTL ? "→" : "←"} {t("pagination:previous") || "Previous"}
      </button>

      {/* Page Indicator */}
      <div className="text-sm text-[var(--muted)] font-dm-sans font-500">
        {t("pagination:page") || "Page"}{" "}
        <span className="text-[var(--ice)] font-syne font-600">
          {currentPage}
        </span>{" "}
        {t("pagination:of") || "of"}{" "}
        <span className="text-[var(--volt)] font-syne font-600">
          {totalPages}
        </span>
      </div>

      {/* Next Button */}
      <button
        onClick={onNextPage}
        disabled={currentPage === totalPages || loading}
        className={`
          px-3.5 py-2 bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/40
          rounded-lg hover:bg-[var(--surface)]/80 hover:border-[var(--border)]/60 transition-all
          disabled:opacity-40 disabled:cursor-not-allowed
          text-sm font-600 font-syne text-[var(--paper)]
          active:scale-95 duration-200
        `}
      >
        {t("pagination:next") || "Next"} {isRTL ? "←" : "→"}
      </button>

      {/* Load Earlier Button (for top of chat) */}
      {currentPage > 1 && onLoadEarlier && (
        <button
          onClick={onLoadEarlier}
          disabled={loading}
          className={`
            ml-2 px-3 py-2 bg-[var(--volt)]/20 border border-[var(--volt)]/50 backdrop-blur-sm
            text-[var(--volt)] rounded-lg text-xs font-600 font-syne
            hover:bg-[var(--volt)]/30 hover:border-[var(--volt)]/70 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-95 duration-200
          `}
        >
          ⬆ {t("pagination:loadEarlier") || "Load Earlier Messages"}
        </button>
      )}
    </div>
  );
}
