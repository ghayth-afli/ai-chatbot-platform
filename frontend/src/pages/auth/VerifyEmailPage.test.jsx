import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "../../hooks/useAuth";
import VerifyEmailPage from "./VerifyEmailPage";
import * as authService from "../../services/authService";

jest.mock("../../services/authService");

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = {
  state: { email: "test@example.com" },
  pathname: "/auth/verify-email",
};

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const translations = {
      "forms.emailAddress": "Email",
      "forms.verificationCode": "Verification Code",
      "forms.codeSixDigits": "Code must be 6 digits",
      "auth.verifyEmail": "Verify Email",
      "auth.verifyEmailDescription":
        "Enter the 6-digit code we sent to your email",
      "auth.didNotReceiveCode": "Didn't receive the code?",
      "auth.resendCode": "Resend Code",
      "auth.resendIn": "Resend in",
      "auth.codeExpired": "Code has expired",
      "auth.invalidCode": "Invalid verification code",
      "auth.wrongEmail": "Wrong email address?",
      "auth.startOver": "Start over",
      "auth.expiresIn": "Code expires in",
      "auth.codeExpiredResend": "Code expired. Please request a new one.",
      "auth.codeSent": "A new code has been sent to your email",
    };

    return {
      t: (key) => translations[key] || key,
      i18n: { language: "en" },
    };
  },
  I18nextProvider: ({ children }) => <>{children}</>,
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test("renders form with email and code input", () => {
    render(
      <Router>
        <AuthProvider>
          <VerifyEmailPage />
        </AuthProvider>
      </Router>,
    );

    // Check that email is displayed (not as an input)
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    // Check that code input exists with label
    expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();
  });

  test("code entry and submission works", async () => {
    authService.verifyEmail.mockResolvedValue({
      success: true,
      data: { user: { email: "test@example.com" } },
    });

    render(
      <Router>
        <AuthProvider>
          <VerifyEmailPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const submitButton = screen.getByRole("button", { name: /verify/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.verifyEmail).toHaveBeenCalled();
    });
  });

  test("displays error message for invalid code", async () => {
    authService.verifyEmail.mockResolvedValue({
      success: false,
      error: { code: "INVALID_CODE", message: "Code is invalid" },
    });

    render(
      <Router>
        <AuthProvider>
          <VerifyEmailPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "999999" } });

    const submitButton = screen.getByRole("button", { name: /verify/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });

  test("displays error message for expired code", async () => {
    authService.verifyEmail.mockResolvedValue({
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Code has expired" },
    });

    render(
      <Router>
        <AuthProvider>
          <VerifyEmailPage />
        </AuthProvider>
      </Router>,
    );

    const codeInput = screen.getByLabelText(/code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const submitButton = screen.getByRole("button", { name: /verify/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });
  });
});
