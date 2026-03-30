import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "../../hooks/useAuth";
import ResetPasswordPage from "./ResetPasswordPage";
import * as authService from "../../services/authService";

jest.mock("../../services/authService");

// Mock i18n
jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const translations = {
      "forms.resetCode": "Reset Code",
      "forms.newPassword": "New Password",
      "forms.confirmPassword": "Confirm Password",
      "forms.passwordTooShort": "Password must be at least 8 characters",
      "forms.passwordReq.length": "At least 8 characters",
      "forms.passwordReq.uppercase": "One uppercase letter",
      "forms.passwordReq.lowercase": "One lowercase letter",
      "forms.passwordReq.number": "One number",
      "forms.passwordReq.special": "One special character",
      "forms.passwordMismatch": "Passwords do not match",
      "forms.codeSixDigits": "Code must be 6 digits",
      "auth.resetPassword": "Reset Password",
      "auth.resetPasswordDescription": "Enter the reset code",
      "auth.security": "Security",
      "auth.securityWarning": "Never share this code.",
      "auth.didNotReceiveCode": "Didn't receive the code?",
      "auth.resendIn": "Resend in",
      "auth.invalidCode": "Code has already been used",
      "auth.codeExpired": "Code has expired",
      "auth.resendFailed": "Failed to resend code",
    };

    return {
      t: (key) => translations[key] || key,
      i18n: { language: "en" },
    };
  },
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    localStorage.setItem("resetEmail", "test@example.com");
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("renders form with code and password inputs", () => {
    render(
      <Router>
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      </Router>,
    );

    expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test("code and password submission works", async () => {
    authService.resetPassword.mockResolvedValue({
      success: true,
      data: { message: "Password reset successfully" },
    });

    render(
      <Router>
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const passwordInputs = screen.getAllByLabelText(/new password/i);
    fireEvent.change(passwordInputs[0], { target: { value: "NewPass123!" } });

    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "NewPass123!" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalled();
    });
  });

  test("displays error for invalid code format", async () => {
    render(
      <Router>
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "12345" } }); // Only 5 digits

    const passwordInputs = screen.getAllByLabelText(/new password/i);
    fireEvent.change(passwordInputs[0], { target: { value: "NewPass123!" } });

    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "NewPass123!" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/6 digits/i)).toBeInTheDocument();
    });
  });

  test("displays error for mismatched passwords", async () => {
    render(
      <Router>
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const passwordInputs = screen.getAllByLabelText(/new password/i);
    fireEvent.change(passwordInputs[0], { target: { value: "NewPass123!" } });

    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "DifferentPass456!" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    });
  });

  test("displays error for weak passwords", async () => {
    render(
      <Router>
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const passwordInputs = screen.getAllByLabelText(/new password/i);
    fireEvent.change(passwordInputs[0], { target: { value: "weak" } }); // Too weak

    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "weak" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i),
      ).toBeInTheDocument();
    });
  });

  test("displays error for code that was already used", async () => {
    authService.resetPassword.mockResolvedValue({
      success: false,
      error: { code: "INVALID_CODE", message: "Code has already been used" },
    });

    render(
      <Router>
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const passwordInputs = screen.getAllByLabelText(/new password/i);
    fireEvent.change(passwordInputs[0], { target: { value: "NewPass123!" } });

    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "NewPass123!" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/already been used/i)).toBeInTheDocument();
    });
  });

  test("displays error for expired code", async () => {
    authService.resetPassword.mockResolvedValue({
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Code has expired" },
    });

    render(
      <Router>
        <AuthProvider>
          <ResetPasswordPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const passwordInputs = screen.getAllByLabelText(/new password/i);
    fireEvent.change(passwordInputs[0], { target: { value: "NewPass123!" } });

    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmInput, { target: { value: "NewPass123!" } });

    const submitButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });
  });
});
