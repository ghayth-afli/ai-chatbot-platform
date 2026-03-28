/**
 * RTL-Aware Button Component
 * [CLARIFICATION Q3]: Supports both LTR and RTL layouts
 *
 * Features:
 * - Automatic padding adjustment for icons (left/right based on language)
 * - Text alignment support
 * - Loading state with spinner
 * - Variants: primary, secondary, danger, ghost
 */

import React from "react";
import { useTranslation } from "react-i18next";

const buttonVariants = {
  primary:
    "bg-volt hover:bg-volt/90 text-ink font-syne font-bold shadow-lg hover:shadow-xl hover:shadow-volt/30 transition-all duration-200",
  secondary:
    "bg-transparent hover:bg-plasma/10 text-plasma border border-plasma font-syne font-bold transition-all duration-200",
  ghost:
    "bg-transparent hover:bg-white/5 text-paper border border-white/20 font-syne font-bold transition-all duration-200",
  plasma:
    "bg-plasma hover:bg-plasma/90 text-white font-syne font-bold shadow-lg hover:shadow-xl hover:shadow-plasma/30 transition-all duration-200",
};

export const Button = React.forwardRef(
  (
    {
      children,
      type = "button",
      variant = "primary",
      disabled = false,
      loading = false,
      icon,
      iconPosition = "left",
      onClick,
      className = "",
      fullWidth = false,
    },
    ref,
  ) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    // Adjust icon position for RTL
    const effectiveIconPosition = isRTL
      ? iconPosition === "left"
        ? "right"
        : "left"
      : iconPosition;

    const baseClasses = `
      px-4 py-3 rounded-lg font-medium transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      flex items-center justify-center gap-2
      ${fullWidth ? "w-full" : ""}
      ${buttonVariants[variant] || buttonVariants.primary}
    `;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        className={`${baseClasses} ${className}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          <>
            {icon && effectiveIconPosition === "left" && icon}
            {children}
            {icon && effectiveIconPosition === "right" && icon}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
