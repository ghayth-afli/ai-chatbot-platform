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

import * as authService from "./authService";

var mockAuthClient;

jest.mock("axios", () => {
  mockAuthClient = {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    create: jest.fn(() => mockAuthClient),
    post: jest.fn(),
  };
});

const resetAuthClientMocks = () => {
  mockAuthClient.post.mockReset();
  mockAuthClient.get.mockReset();
  mockAuthClient.patch.mockReset();
  if (mockAuthClient.delete) {
    mockAuthClient.delete.mockReset();
  }
};

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    resetAuthClientMocks();
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

      mockAuthClient.post.mockResolvedValue(mockResponse);

      const result = await authService.signup(
        "test@example.com",
        "TestPass123!",
        "Test",
        "User",
      );

      expect(mockAuthClient.post).toHaveBeenCalledWith(
        "/signup/",
        expect.objectContaining({
          email: "test@example.com",
          first_name: "Test",
          last_name: "User",
          language: "en",
        }),
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

      mockAuthClient.post.mockRejectedValue(mockError);

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
          refresh_token: "mock_refresh_456",
        },
      };

      mockAuthClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login(
        "test@example.com",
        "TestPass123!",
      );

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe("test@example.com");
      expect(localStorage.getItem("user")).toBeDefined();
      expect(localStorage.getItem("access_token")).toBe("mock_token_123");
      expect(localStorage.getItem("refresh_token")).toBe("mock_refresh_456");
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

      mockAuthClient.post.mockRejectedValue(mockError);

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

      mockAuthClient.post.mockResolvedValue(mockResponse);

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

      mockAuthClient.post.mockRejectedValue(mockError);

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

      mockAuthClient.post.mockResolvedValue(mockResponse);

      const result = await authService.forgotPassword("test@example.com");

      expect(result.success).toBe(true);
      expect(mockAuthClient.post).toHaveBeenCalledWith(
        "/forgot-password/",
        expect.objectContaining({ email: "test@example.com", language: "en" }),
      );
    });

    it("should reset password with valid code", async () => {
      const mockResponse = {
        data: {
          message: "Password reset successfully",
        },
      };

      mockAuthClient.post.mockResolvedValue(mockResponse);

      const result = await authService.resetPassword(
        "test@example.com",
        "123456",
        "NewPass123!",
      );

      expect(result.success).toBe(true);
    });
  });
});
