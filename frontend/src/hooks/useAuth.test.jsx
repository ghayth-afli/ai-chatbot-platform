/**
 * useAuth Hook Tests
 *
 * Tests for:
 * - Initial auth state
 * - User signup
 * - User login
 * - User logout
 * - Email verification
 * - Error handling
 */

import React from "react";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../useAuth";
import * as authService from "../../services/authService";

jest.mock("../../services/authService");

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe("useAuth Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("should initialize with unauthenticated state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("should handle successful signup", async () => {
    authService.signup.mockResolvedValue({
      success: true,
      data: {
        user: {
          id: 1,
          email: "test@example.com",
          is_verified: false,
        },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signup(
        "test@example.com",
        "TestPass123!",
        "Test",
        "User",
      );

      expect(response.success).toBe(true);
    });
  });

  it("should handle successful login", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      first_name: "Test",
      is_verified: true,
    };

    authService.login.mockResolvedValue({
      success: true,
      data: { user: mockUser },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@example.com", "TestPass123!");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it("should handle logout", async () => {
    authService.logout.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Set authenticated state
    act(() => {
      localStorage.setItem("user", JSON.stringify({ id: 1 }));
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("should handle email verification", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      is_verified: false,
    };

    authService.verifyEmail.mockResolvedValue({
      success: true,
      data: { message: "Verified" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Set user state
    act(() => {
      localStorage.setItem("user", JSON.stringify(mockUser));
    });

    await act(async () => {
      await result.current.verifyEmail("test@example.com", "123456");
    });

    // After verification, is_verified should be updated
    expect(result.current.isVerified).toBe(true);
  });

  it("should handle login error", async () => {
    authService.login.mockResolvedValue({
      success: false,
      error: {
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.login(
        "test@example.com",
        "WrongPassword",
      );
      expect(response.success).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeDefined();
  });

  it("should clear error messages", async () => {
    authService.login.mockResolvedValue({
      success: false,
      error: { message: "Error" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@example.com", "wrong");
    });

    expect(result.current.error).toBeDefined();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
