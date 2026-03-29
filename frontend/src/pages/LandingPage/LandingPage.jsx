import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";

// Sub-components
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Models from "./components/Models";
import Bilingual from "./components/Bilingual";
import About from "./components/About";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

/**
 * LandingPage Component
 * Main landing page showcasing the nexus AI platform
 * Includes all sections: Nav, Hero, Features, Models, Bilingual, About, CTA, Footer
 * Full i18n support for EN/AR bilingual interface
 */
export default function LandingPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track scroll position for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle RTL direction based on language
  useEffect(() => {
    const isArabic = i18n.language === "ar";
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className={styles.landingPageContainer}>
      <Navbar
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
        onNavigateChat={() => navigate("/chat")}
      />

      <main className={styles.mainContent}>
        <Hero onNavigateChat={() => navigate("/chat")} />
        <Features />
        <Models />
        <Bilingual />
        <About />
        <CTA onNavigateChat={() => navigate("/chat")} />
      </main>

      <Footer />
    </div>
  );
}
