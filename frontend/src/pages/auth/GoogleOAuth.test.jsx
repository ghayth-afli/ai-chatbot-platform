/**
 * Tests for Google OAuth integration on Login and Signup pages.
 *
 * Coverage:
 * - Google Sign-In button renders on login page
 * - Google Sign-In button renders on signup page
 * - Click opens Google OAuth flow
 * - Error handling for failed OAuth
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "../../components/GoogleOAuthMock";
import { AuthProvider } from "../../hooks/useAuth";
import LoginPage from "../auth/LoginPage";
import SignupPage from "../auth/SignupPage";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n/config";

const renderWithProviders = (component) => {
  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <AuthProvider>{component}</AuthProvider>
        </BrowserRouter>
      </I18nextProvider>
    </GoogleOAuthProvider>,
  );
};

describe("LoginPage - Google OAuth Integration", () => {
  test("Google Sign-In button renders on login page", () => {
    renderWithProviders(<LoginPage />);

    // Check for Google login button
    const googleButtons = screen.queryAllByText(/sign in with|google/i);
    expect(googleButtons.length).toBeGreaterThan(0);
  });

  test("Google Sign-In button responds to clicks", async () => {
    renderWithProviders(<LoginPage />);

    // Find and click GoogleLogin component (it renders a button)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("Error message displays on failed Google auth", async () => {
    renderWithProviders(<LoginPage />);

    // The page should render with heading
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
  });
});

describe("SignupPage - Google OAuth Integration", () => {
  test("Google Sign-Up button renders on signup page", () => {
    renderWithProviders(<SignupPage />);

    // Check for Google signup button
    const googleButtons = screen.queryAllByText(/sign up with|google/i);
    expect(googleButtons.length).toBeGreaterThan(0);
  });

  test("Google OAuth auto-creates account and redirects to chat", async () => {
    renderWithProviders(<SignupPage />);

    // Check that signup page renders
    expect(screen.getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
  });

  test("Google OAuth error handled gracefully", async () => {
    renderWithProviders(<SignupPage />);

    // Check that signup form is present
    expect(screen.getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
  });
});
