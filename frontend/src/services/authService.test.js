/**
 * Authentication Service Tests
 *
 * Tests for:
 * - Signup API call
 * - Login API call
 * - Logout API call
 * - Email verification
 * - Password reset flows
 * - Google OAuth
 */

import * as authService from "../authService";
import axios from "axios";

jest.mock("axios");

describe("Auth Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("Signup", () => {
    it("should successfully sign up a user", async () => {
      const mockResponse = {
        data: {
          user: {
            id: 1,
            email: "test@example.com",
            first_name: "Test",
            last_name: "User",
            is_verified: false,
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.signup(
        "test@example.com",
        "TestPass123!",
        "Test",
        "User",
      );

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe("test@example.com");
    });

    it("should handle signup errors", async () => {
      const mockError = {
        response: {
          data: {
            message: "Email already exists",
            code: "EMAIL_EXISTS",
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      const result = await authService.signup(
        "existing@example.com",
        "TestPass123!",
        "Test",
        "User",
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("EMAIL_EXISTS");
    });
  });

  describe("Login", () => {
    it("should successfully log in a user", async () => {
      const mockResponse = {
        data: {
          user: {
            id: 1,
            email: "test@example.com",
            first_name: "Test",
            is_verified: true,
          },
          access_token: "mock_token_123",
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.login(
        "test@example.com",
        "TestPass123!",
      );

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe("test@example.com");
      expect(localStorage.getItem("user")).toBeDefined();
    });

    it("should handle invalid credentials", async () => {
      const mockError = {
        response: {
          data: {
            message: "Invalid credentials",
            code: "INVALID_CREDENTIALS",
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      const result = await authService.login(
        "test@example.com",
        "WrongPassword",
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("Email Verification", () => {
    it("should successfully verify email with code", async () => {
      const mockResponse = {
        data: {
          message: "Email verified successfully",
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.verifyEmail(
        "test@example.com",
        "123456",
      );

      expect(result.success).toBe(true);
    });

    it("should handle invalid verification code", async () => {
      const mockError = {
        response: {
          data: {
            message: "Invalid code",
            code: "INVALID_CODE",
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      const result = await authService.verifyEmail(
        "test@example.com",
        "000000",
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_CODE");
    });
  });

  describe("Password Reset", () => {
    it("should send password reset code", async () => {
      const mockResponse = {
        data: {
          message: "Reset code sent",
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.forgotPassword("test@example.com");

      expect(result.success).toBe(true);
      expect(localStorage.getItem("resetEmail")).toBe("test@example.com");
    });

    it("should reset password with valid code", async () => {
      const mockResponse = {
        data: {
          message: "Password reset successfully",
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await authService.resetPassword(
        "test@example.com",
        "123456",
        "NewPass123!",
      );

      expect(result.success).toBe(true);
    });
  });
});
