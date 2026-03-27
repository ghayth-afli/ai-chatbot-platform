import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY, SUPPORTED_LANGUAGES, DEFAULT_LANG } from "../i18n/config";

const LanguageContext = createContext(null);

/**
 * LanguageProvider component
 *
 * Wraps the application and provides language switching functionality.
 * - Manages current locale and text direction (RTL/LTR)
 * - Syncs language preference to localStorage
 * - Updates document.dir and document.lang
 * - Provides useLanguage() hook for child components
 */
export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [locale, setLocale] = useState(
    localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG,
  );
  const [dir, setDir] = useState(SUPPORTED_LANGUAGES[locale]?.dir || "ltr");

  // Handle language change
  const changeLanguage = useCallback(
    async (newLocale) => {
      if (!SUPPORTED_LANGUAGES[newLocale]) {
        console.warn(`Unsupported language: ${newLocale}`);
        return;
      }

      // Update i18next
      await i18n.changeLanguage(newLocale);

      // Update state
      setLocale(newLocale);
      const newDir = SUPPORTED_LANGUAGES[newLocale].dir;
      setDir(newDir);

      // Update document
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newDir;

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, newLocale);
      localStorage.setItem(`${STORAGE_KEY}.dir`, newDir);

      // Dispatch custom event for subscribers
      window.dispatchEvent(
        new CustomEvent("languageChanged", {
          detail: { locale: newLocale, dir: newDir },
        }),
      );
    },
    [i18n],
  );

  // Hydrate direction on mount
  useEffect(() => {
    const storedDir = localStorage.getItem(`${STORAGE_KEY}.dir`);
    if (storedDir && storedDir !== dir) {
      setDir(storedDir);
      document.documentElement.dir = storedDir;
    }
  }, [dir]);

  // Ensure document is always in sync
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const value = {
    locale,
    dir,
    isArabic: locale === "ar",
    isLTR: dir === "ltr",
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * useLanguage hook
 *
 * Returns current language preference and changeLanguage function.
 *
 * Usage:
 *   const { locale, dir, changeLanguage } = useLanguage();
 *   changeLanguage('ar'); // Switch to Arabic
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(
      "useLanguage must be used within a LanguageProvider. Make sure to wrap your app with <LanguageProvider>.",
    );
  }
  return context;
};

export default LanguageProvider;
