import React, { useState, useEffect } from "react";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Models from "../components/landing/Models";
import Bilingual from "../components/landing/Bilingual";
import About from "../components/landing/About";
import Footer from "../components/landing/Footer";
import Navbar from "../components/landing/Navbar";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Landing = () => {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  // Show sticky CTA after scrolling past hero section (mobile only: < 1024px)
  useEffect(() => {
    const handleScroll = () => {
      // Only show sticky CTA on mobile (<1024px / lg breakpoint)
      if (window.innerWidth >= 1024) {
        setShowStickyCTA(false);
        return;
      }

      const heroSection = document.getElementById("hero");
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        setShowStickyCTA(heroBottom < 0);
      }
    };

    const handleResize = () => {
      // Hide sticky CTA if resized to desktop
      if (window.innerWidth >= 1024) {
        setShowStickyCTA(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className={`landing-page ${dir === "rtl" ? "rtl" : "ltr"} w-screen overflow-x-hidden`}
    >
      <Navbar />

      <main>
        <section
          id="hero"
          className="min-h-screen flex items-center justify-center relative overflow-hidden bg-ink pt-20 lg:pt-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-plasma/20 via-transparent to-ice/10 blur-3xl" />
          <Hero />
        </section>

        <section
          id="features"
          className="py-20 px-4 sm:px-8 bg-ink border-t border-border"
        >
          <Features />
        </section>

        <section
          id="models"
          className="py-20 px-4 sm:px-8 bg-surface border-t border-border"
        >
          <Models />
        </section>

        <section
          id="bilingual"
          className="py-20 px-4 sm:px-8 bg-ink border-t border-border"
        >
          <Bilingual />
        </section>

        <section
          id="about"
          className="py-20 px-4 sm:px-8 bg-surface border-t border-border pb-32 lg:pb-20"
        >
          <About />
        </section>

        <footer id="footer" className="border-t border-border bg-ink">
          <Footer />
        </footer>
      </main>

      {/* 📱 Sticky CTA Button for Mobile - Improves Mobile Conversion */}
      {showStickyCTA && window.innerWidth < 1024 && (
        <div
          className="fixed bottom-0 left-0 right-0 w-full bg-ink/95 backdrop-blur border-t border-border px-4 sm:px-8 py-4 pb-6 sm:pb-4 animate-fade-in z-40 overflow-hidden"
          role="region"
          aria-live="polite"
          aria-label="Call-to-action banner"
        >
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/auth/signup")}
              className="w-full px-6 py-3 bg-volt text-ink font-bold rounded-lg hover:bg-paper active:scale-95 transition-all duration-200 font-syne uppercase tracking-wide text-sm focus:ring-2 focus:ring-offset-2 focus:ring-volt"
              aria-label="Get started with nexus AI platform"
            >
              {t("hero.cta.default") || "Get Started"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
