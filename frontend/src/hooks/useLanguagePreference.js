import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

/**
 * useLanguagePreference Hook
 *
 * Manages user's language preference switching with:
 * - Getting current preference from API
 * - Setting new preference via PATCH endpoint
 * - Updating i18n language
 * - Setting RTL document direction for Arabic
 *
 * Returns:
 * - language: string (en/ar)
 * - setLanguage: (lang) => Promise - sets new language preference
 * - loading: boolean - request in progress
 * - error: string|null - error message if any
 * - available: array - available languages
 */
export const useLanguagePreference = (userId) => {
  const [language, setLanguageState] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { i18n } = useTranslation();

  const AVAILABLE_LANGUAGES = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
  ];

  // Initialize language from localStorage or API
  useEffect(() => {
    if (!userId) return;

    const initializeLanguage = async () => {
      try {
        // Check localStorage first for performance
        const storedLang = localStorage.getItem(`user_${userId}_language`);
        if (
          storedLang &&
          AVAILABLE_LANGUAGES.some((l) => l.code === storedLang)
        ) {
          setLanguageState(storedLang);
          updateI18nLanguage(storedLang);
          return;
        }

        // Fallback to browser language or 'en'
        const browserLang = navigator.language.split("-")[0];
        const defaultLang = ["en", "ar"].includes(browserLang)
          ? browserLang
          : "en";
        setLanguageState(defaultLang);
        updateI18nLanguage(defaultLang);
      } catch (err) {
        console.error("Failed to initialize language preference:", err);
        setLanguageState("en");
        updateI18nLanguage("en");
      }
    };

    initializeLanguage();
  }, [userId]);

  const updateI18nLanguage = (lang) => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    // Update document direction for RTL support
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  const setLanguage = async (newLanguage) => {
    // Validate language
    if (!AVAILABLE_LANGUAGES.some((l) => l.code === newLanguage)) {
      setError(`Invalid language: ${newLanguage}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");

      // Update on backend
      await axios.patch(
        `/api/ai/users/${userId}/language-preference`,
        { language_preference: newLanguage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Update local state and i18n
      setLanguageState(newLanguage);
      updateI18nLanguage(newLanguage);

      // Cache preference
      localStorage.setItem(`user_${userId}_language`, newLanguage);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.language_preference?.[0] ||
        "Failed to update language preference";
      setError(errorMessage);
      console.error("Language preference update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    language,
    setLanguage,
    loading,
    error,
    available: AVAILABLE_LANGUAGES,
  };
};
