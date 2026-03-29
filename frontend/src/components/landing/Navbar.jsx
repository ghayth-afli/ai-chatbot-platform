import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { navigationRoutes } from "../../data/landingContent";

/**
 * Navbar Component (T029: Mobile-First with Focus-Trap)
 *
 * Persistent header with:
 * - Brand logo/wordmark
 * - Desktop navigation links
 * - Mobile hamburger menu with focus-trap for accessibility
 * - Language toggle (EN/AR)
 * - Signup/Login call-to-action buttons
 * - Responsive design from 320px+ with smooth opening/closing animation
 *
 * Accessibility Features:
 * - Focus-trap keeps keyboard navigation within mobile menu when open
 * - ARIA attributes for screen readers
 * - Proper tab order management
 * - ESC key to close menu
 * - Smooth transitions for visual feedback
 */
const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale, changeLanguage, isArabic } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const firstMenuItemRef = useRef(null);

  // Focus-trap: Keep keyboard focus within mobile menu when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Close menu on ESC key
      if (e.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      // Implement focus-trap on Tab key
      if (e.key !== "Tab") return;

      const focusableElements =
        mobileMenuRef.current?.querySelectorAll(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        ) || [];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Trap focus: if pressing Tab on last element, focus first
      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Trap focus: if pressing Shift+Tab on first element, focus last
      else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    // Auto-focus first menu item when menu opens
    if (isOpen && firstMenuItemRef.current) {
      firstMenuItemRef.current.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close menu on body click (outside menu)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        !mobileMenuRef.current?.contains(e.target) &&
        !menuButtonRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  const handleNavClick = (route) => {
    if (route.type === "anchor" && route.targetId) {
      const element = document.getElementById(route.targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setIsOpen(false);
      }
    } else if (route.type === "route") {
      navigate(route.path);
      setIsOpen(false);
    }
  };

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    changeLanguage(newLocale);
  };

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  const primaryLinks = navigationRoutes.filter(
    (r) =>
      !r.requiresAuth &&
      r.id !== "home" &&
      r.id !== "chat" &&
      r.id !== "login" &&
      r.id !== "signup",
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-ink/90 backdrop-blur border-b border-border ${isArabic ? "rtl" : "ltr"}`}
      aria-label={t("nav.label") || "Main navigation"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-volt rounded-lg p-1"
            aria-label={t("nav.home") || "Home"}
          >
            <span className="font-['Syne'] font-black text-lg sm:text-xl text-paper">
              nexus
            </span>
            <span className="text-volt font-black text-lg sm:text-xl">•</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {primaryLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link)}
                className="text-xs sm:text-sm uppercase tracking-wider text-paper/70 hover:text-volt transition-colors font-mono focus:outline-none focus:ring-2 focus:ring-volt rounded px-2 py-1"
              >
                {t(link.labelKey)}
              </button>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => navigate("/auth/login")}
              className="px-4 py-2 rounded-lg border border-volt text-volt font-bold text-sm hover:bg-volt/10 transition-colors focus:outline-none focus:ring-2 focus:ring-volt"
            >
              {t("nav.login")}
            </button>
            <button
              onClick={() => navigate("/auth/signup")}
              className="px-4 py-2 rounded-lg bg-volt text-ink font-bold text-sm hover:bg-paper transition-colors focus:outline-none focus:ring-2 focus:ring-volt/50"
            >
              {t("nav.signup")}
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-2 sm:px-3 py-2 rounded-lg border border-border text-muted hover:border-volt hover:text-volt transition-colors text-xs sm:text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-volt"
              aria-label={
                locale === "en" ? "Switch to Arabic" : "Switch to English"
              }
            >
              {locale === "en" ? "عربي" : "EN"}
            </button>

            {/* Mobile Menu Button */}
            <button
              ref={menuButtonRef}
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 hover:bg-glass rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-volt"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-paper"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu with Focus-Trap */}
        {isOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-menu"
            className="lg:hidden mt-3 sm:mt-4 pb-4 space-y-2 border-t border-border pt-4 animate-in fade-in slide-in-from-top-2 duration-200"
            role="region"
            aria-label={t("nav.mobileMenu") || "Mobile menu"}
          >
            {primaryLinks.map((link, index) => (
              <button
                key={link.id}
                ref={index === 0 ? firstMenuItemRef : null}
                onClick={() => handleNavClick(link)}
                className="block w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm uppercase tracking-wider text-paper/70 hover:text-volt hover:bg-glass focus:bg-glass focus:outline-none focus:ring-2 focus:ring-volt transition-colors font-mono"
              >
                {t(link.labelKey)}
              </button>
            ))}

            {/* Mobile Auth Buttons */}
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              <button
                onClick={() => {
                  navigate("/auth/login");
                  setIsOpen(false);
                }}
                className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-volt text-volt font-bold text-sm hover:bg-volt/10 transition-colors focus:outline-none focus:ring-2 focus:ring-volt"
              >
                {t("nav.login")}
              </button>
              <button
                onClick={() => {
                  navigate("/auth/signup");
                  setIsOpen(false);
                }}
                className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-volt text-ink font-bold text-sm hover:bg-paper transition-colors focus:outline-none focus:ring-2 focus:ring-volt/50"
              >
                {t("nav.signup")}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
