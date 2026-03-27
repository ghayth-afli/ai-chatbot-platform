import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enJSON from "./en.json";
import arJSON from "./ar.json";

const STORAGE_KEY = "nexus.lang";
const DEFAULT_LANG = "en";
const SUPPORTED_LANGUAGES = {
  en: { dir: "ltr", name: "English" },
  ar: { dir: "rtl", name: "العربية" },
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enJSON },
    ar: { translation: arJSON },
  },
  lng: localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG,
  fallbackLng: DEFAULT_LANG,
  supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
  interpolation: {
    escapeValue: false,
  },
  missingKeyHandler: (lngs, ns, key) => {
    console.warn(`Missing translation key: ${key} in namespace: ${ns}`);
  },
  detection: {
    order: ["localStorage", "navigator"],
  },
});

// Initialize document direction on boot
const initialLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
const initialDir = SUPPORTED_LANGUAGES[initialLang]?.dir || "ltr";
document.documentElement.dir = initialDir;
document.documentElement.lang = initialLang;

export default i18n;
export { STORAGE_KEY, DEFAULT_LANG, SUPPORTED_LANGUAGES };
