import { renderHook, act } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n/config";
import { LanguageProvider, useLanguage } from "../useLanguage";
import "@testing-library/jest-dom";

/**
 * useLanguage Hook Tests
 *
 * Covers:
 * - Language persistence via localStorage
 * - Direction flipping (RTL/LTR)
 * - Document state updates
 * - Language change functionality
 */
describe("useLanguage Hook", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document state
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
  });

  const wrapper = ({ children }) => (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>{children}</LanguageProvider>
    </I18nextProvider>
  );

  test("initializes with default locale (en)", () => {
    const { result } = renderHook(useLanguage, { wrapper });

    expect(result.current.locale).toBe("en");
    expect(result.current.dir).toBe("ltr");
    expect(result.current.isArabic).toBe(false);
    expect(result.current.isLTR).toBe(true);
  });

  test("throws error when used outside LanguageProvider", () => {
    // Suppress console error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => renderHook(useLanguage)).toThrow(
      "useLanguage must be used within a LanguageProvider",
    );

    consoleSpy.mockRestore();
  });

  test("changes language to Arabic", async () => {
    const { result } = renderHook(useLanguage, { wrapper });

    await act(async () => {
      await result.current.changeLanguage("ar");
    });

    expect(result.current.locale).toBe("ar");
    expect(result.current.dir).toBe("rtl");
    expect(result.current.isArabic).toBe(true);
    expect(result.current.isLTR).toBe(false);
  });

  test("persists language to localStorage", async () => {
    const { result } = renderHook(useLanguage, { wrapper });

    await act(async () => {
      await result.current.changeLanguage("ar");
    });

    expect(localStorage.getItem("nexus.lang")).toBe("ar");
  });

  test("updates document direction on language change", async () => {
    const { result } = renderHook(useLanguage, { wrapper });

    await act(async () => {
      await result.current.changeLanguage("ar");
    });

    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
  });

  test("toggles between English and Arabic", async () => {
    const { result } = renderHook(useLanguage, { wrapper });

    await act(async () => {
      await result.current.changeLanguage("ar");
    });

    expect(result.current.locale).toBe("ar");

    await act(async () => {
      await result.current.changeLanguage("en");
    });

    expect(result.current.locale).toBe("en");
    expect(result.current.dir).toBe("ltr");
  });

  test("ignores unsupported language codes", async () => {
    const { result } = renderHook(useLanguage, { wrapper });
    const initialLocale = result.current.locale;

    // Suppress console warning for this test
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    await act(async () => {
      await result.current.changeLanguage("xx");
    });

    expect(result.current.locale).toBe(initialLocale);
    consoleSpy.mockRestore();
  });
});
