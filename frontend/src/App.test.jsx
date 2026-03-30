import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";
import { LanguageProvider } from "./hooks/useLanguage";
import "@testing-library/jest-dom";
import LandingPage from "./pages/LandingPage/LandingPage";

jest.mock("./hooks/useAuthStatus", () => ({
  useAuthStatus: jest.fn(() => ({
    isAuthenticated: false,
    toggleAuth: jest.fn(),
    user: null,
  })),
}));

jest.mock("./hooks/useAuth", () => {
  const actual = jest.requireActual("./hooks/useAuth");
  return {
    ...actual,
    AuthProvider: ({ children }) => <>{children}</>,
    useAuth: () => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signup: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      verifyEmail: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      resendCode: jest.fn(),
      googleSignIn: jest.fn(),
    }),
  };
});

const SECTION_IDS = [
  "hero",
  "features",
  "models",
  "bilingual",
  "about",
  "footer",
];

const renderLanding = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/"]}>
          <LandingPage />
        </MemoryRouter>
      </LanguageProvider>
    </I18nextProvider>,
  );

describe("Landing Page Integration", () => {
  test("renders without crashing", () => {
    expect(() => renderLanding()).not.toThrow();
  });

  test("shows hero CTAs and brand wordmark", () => {
    renderLanding();
    expect(screen.getAllByText(/nexus/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Start Chatting/i)).toBeInTheDocument();
    expect(screen.getByText(/Learn More/i)).toBeInTheDocument();
  });

  test("navbar exposes login and chat entry points", () => {
    renderLanding();
    const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThan(0);
    expect(signInLinks[0]).toHaveAttribute(
      "href",
      expect.stringMatching(/auth\/login/i),
    );
    const chatLinks = screen.getAllByRole("link", { name: /start chat/i });
    expect(chatLinks.length).toBeGreaterThan(0);
    expect(chatLinks[0]).toHaveAttribute(
      "href",
      expect.stringMatching(/chat/),
    );
  });

  test("language toggle button is available", () => {
    renderLanding();
    const toggle = screen
      .getAllByRole("button")
      .find((btn) => /EN|عربي/i.test(btn.textContent || ""));
    expect(toggle).toBeTruthy();
  });

  test("core sections are mounted", () => {
    renderLanding();
    SECTION_IDS.forEach((id) => {
      expect(document.getElementById(id)).toBeInTheDocument();
    });
  });

  test("mobile menu exposes anchors for key sections", () => {
    renderLanding();
    const menu = document.querySelector(".mobMenu");
    expect(menu).toBeTruthy();
    const labels = Array.from(menu.querySelectorAll("a")).map((link) =>
      (link.textContent || "").trim().toLowerCase(),
    );
    expect(labels).toEqual(
      expect.arrayContaining(["features", "models", "about", "start chat"]),
    );
  });

  test("bilingual callout and footer render", () => {
    renderLanding();
    expect(document.querySelector("#bilingual")).toBeInTheDocument();
    expect(document.querySelector("#footer")).toBeInTheDocument();
  });

  test("hero chips render provider badges", () => {
    renderLanding();
    const chipCount = document.querySelectorAll(".heroChips .chip").length;
    expect(chipCount).toBeGreaterThan(0);
  });
});
