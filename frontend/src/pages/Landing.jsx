import React from "react";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Models from "../components/landing/Models";
import Bilingual from "../components/landing/Bilingual";
import About from "../components/landing/About";
import Footer from "../components/landing/Footer";
import Navbar from "../components/landing/Navbar";
import { useLanguage } from "../hooks/useLanguage";

const Landing = () => {
  const { dir } = useLanguage();

  return (
    <div className={`landing-page ${dir === "rtl" ? "rtl" : "ltr"}`}>
      <Navbar />

      <main>
        <section
          id="hero"
          className="min-h-screen flex items-center justify-center relative overflow-hidden bg-ink"
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
          className="py-20 px-4 sm:px-8 bg-surface border-t border-border"
        >
          <About />
        </section>

        <footer id="footer" className="border-t border-border bg-ink">
          <Footer />
        </footer>
      </main>
    </div>
  );
};

export default Landing;
