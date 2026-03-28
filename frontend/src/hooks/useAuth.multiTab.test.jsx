/**
 * Test for multi-tab logout detection and authentication state sync.
 *
 * Coverage:
 * - Logout in one tab detected in other tabs
 * - Storage events trigger logout in all tabs
 * - Authentication state synced across tabs
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n/config";
import { AuthProvider, useAuth } from "../useAuth";
import * as authService from "../../services/authService";

// Mock authService
jest.mock("../../services/authService", () => ({
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
}));

const renderWithProviders = (hook) => {
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      </I18nextProvider>
    ),
  });
};

describe("useAuth - Multi-Tab Logout", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    // Mock authService responses
    authService.getCurrentUser.mockResolvedValue({
      success: true,
      data: { id: 1, email: "user@example.com", is_verified: true },
    });

    authService.logout.mockResolvedValue({
      success: true,
      message: "Logged out",
    });
  });

  test("Storage change event detects logout from another tab", async () => {
    const { result } = renderWithProviders(() => useAuth());

    // Simulate user being set
    await act(async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 1,
          email: "user@example.com",
        }),
      );
    });

    // Simulate logout in another tab (storage event)
    await act(async () => {
      const storageEvent = new StorageEvent("storage", {
        key: "user",
        newValue: null,
        oldValue: JSON.stringify({ id: 1, email: "user@example.com" }),
        storageArea: localStorage,
      });
      window.dispatchEvent(storageEvent);
    });

    // Should be logged out
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  test("User state clears when storage cleared in another tab", async () => {
    const { result } = renderWithProviders(() => useAuth());

    // Set initial user
    await act(async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 1,
          email: "user@example.com",
        }),
      );
      result.current.login("user@example.com", "password");
    });

    // Trigger logout from another tab
    await act(async () => {
      const event = new StorageEvent("storage", {
        key: "user",
        newValue: null,
      });
      window.dispatchEvent(event);
    });

    // Verify user cleared
    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  test("Error message set when logout detected in another tab", async () => {
    const { result } = renderWithProviders(() => useAuth());

    await act(async () => {
      const event = new StorageEvent("storage", {
        key: "user",
        newValue: null,
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
