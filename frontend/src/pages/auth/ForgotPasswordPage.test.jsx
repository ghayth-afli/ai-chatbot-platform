import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "../../hooks/useAuth";
import ForgotPasswordPage from "./ForgotPasswordPage";
import * as authService from "../../services/authService";

jest.mock("../../services/authService");

// Mock i18n
jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const translations = {
      "forms.email": "Email Address",
      "forms.emailInvalid": "Invalid email address",
      "auth.forgotPassword": "Forgot Password",
      "auth.forgotPasswordDescription":
        "Enter your email and we'll send you a reset code",
      "auth.sendResetCode": "Send Reset Code",
      "auth.resetCodeSent": "Reset code sent!",
      "auth.resetCodeSentDescription":
        "Check your email for the reset code. Redirecting...",
      "auth.tip": "Tip",
      "auth.resetTip":
        "Check your spam folder if you don't see the email within a few minutes",
      "auth.backToLogin": "Back to Login",
      "auth.emailNotFound": "Email not found",
      "auth.resetFailed": "Failed to send reset code",
    };

    return {
      t: (key) => translations[key] || key,
      i18n: { language: "en" },
    };
  },
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders form with email input", () => {
    render(
      <Router>
        <AuthProvider>
          <ForgotPasswordPage />
        </AuthProvider>
      </Router>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  test("email submission works", async () => {
    authService.forgotPassword.mockResolvedValue({
      success: true,
      data: { message: "Reset code sent" },
    });

    render(
      <Router>
        <AuthProvider>
          <ForgotPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        "test@example.com",
        "en",
      );
    });
  });

  test("displays error for invalid email", async () => {
    render(
      <Router>
        <AuthProvider>
          <ForgotPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });

  test("displays error for non-existent email", async () => {
    authService.forgotPassword.mockResolvedValue({
      success: false,
      error: { code: "USER_NOT_FOUND", message: "Email not found" },
    });

    render(
      <Router>
        <AuthProvider>
          <ForgotPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, {
      target: { value: "nonexistent@example.com" },
    });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  test("shows success message on code send", async () => {
    authService.forgotPassword.mockResolvedValue({
      success: true,
      data: { message: "Reset code sent" },
    });

    render(
      <Router>
        <AuthProvider>
          <ForgotPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/reset code sent/i)).toBeInTheDocument();
    });
  });
});
