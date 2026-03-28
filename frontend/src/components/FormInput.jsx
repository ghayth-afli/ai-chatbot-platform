/**
 * RTL-Aware Form Input Component
 * [CLARIFICATION Q3]: Automatically adjusts layout direction and text alignment for RTL languages
 *
 * Features:
 * - Dynamic dir="rtl" attribute based on language
 * - RTL Tailwind classes (text-right, ml-2 for RTL)
 * - Label positioning (left for RTL, right for LTR)
 * - Error message alignment
 */

import React from "react";
import { useTranslation } from "react-i18next";

export const FormInput = React.forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder,
      value,
      onChange,
      error,
      required = false,
      disabled = false,
      autoComplete,
      pattern,
      minLength,
      maxLength,
      className = "",
    },
    ref,
  ) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    return (
      <div className="mb-4" dir={isRTL ? "rtl" : "ltr"}>
        {label && (
          <label
            htmlFor={name}
            className={`block text-sm font-dm-sans font-medium text-paper mb-2 ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {label}
            {required && <span className="text-spark ms-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          pattern={pattern}
          minLength={minLength}
          maxLength={maxLength}
          className={`w-full px-4 py-3 bg-surface text-paper border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-volt focus:border-volt disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted ${
            error
              ? "border-spark bg-spark/5"
              : "border-white/10 hover:border-white/20"
          } ${isRTL ? "text-right" : "text-left"} ${className}`}
          dir={isRTL ? "rtl" : "ltr"}
        />

        {error && (
          <p
            className={`mt-1 text-xs text-spark font-dm-sans ${isRTL ? "text-right" : "text-left"}`}
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

export default FormInput;
