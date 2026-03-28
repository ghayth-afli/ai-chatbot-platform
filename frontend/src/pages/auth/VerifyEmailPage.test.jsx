import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import VerifyEmailPage from "./VerifyEmailPage";
import * as authService from "../services/authService";

jest.mock("../services/authService");

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders form with email and code input", () => {
    render(
      <Router>
        <VerifyEmailPage />
      </Router>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
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
        <VerifyEmailPage />
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
        <VerifyEmailPage />
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
        <VerifyEmailPage />
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
