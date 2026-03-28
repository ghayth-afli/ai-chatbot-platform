/**
 * Authentication Context Hook
 *
 * Global state management for:
 * - Current user data
 * - Authentication status
 * - Loading states during auth operations
 * - Auth function wrappers with state updates
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

/**
 * Auth Context Provider Component
 * Wrap app with this to provide auth state globally
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage and verify with backend
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user exists in localStorage
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);

          // Verify with backend (calls GET /api/auth/me/)
          const result = await authService.getCurrentUser();
          if (result.success) {
            setUser(result.data);
            localStorage.setItem("user", JSON.stringify(result.data));
          } else {
            // Token invalid - clear local state
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("user");
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Multi-tab logout detection: Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      // If user was removed from localStorage in another tab, logout here too
      if (event.key === "user" && event.newValue === null) {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("pendingVerification");
        setError("You have been logged out from another tab");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const signup = async (
    email,
    password,
    firstName,
    lastName,
    language = "en",
  ) => {
    setIsLoading(true);
    setError(null);

    const result = await authService.signup(
      email,
      password,
      firstName,
      lastName,
      language,
    );

    if (result.success) {
      // User created but not verified - store for verification flow
      localStorage.setItem(
        "pendingVerification",
        JSON.stringify({
          email,
          isVerified: false,
        }),
      );
      setError(null);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    const result = await authService.login(email, password);

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      localStorage.removeItem("pendingVerification");
      setError(null);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    const result = await authService.logout();

    if (result.success) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("pendingVerification");
      setError(null);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const verifyEmail = async (email, code) => {
    setIsLoading(true);
    setError(null);

    const result = await authService.verifyEmail(email, code);

    if (result.success) {
      // Update user verified status if already logged in
      if (user) {
        setUser({ ...user, is_verified: true });
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, is_verified: true }),
        );
      }
      localStorage.removeItem("pendingVerification");
      setError(null);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const forgotPassword = async (email, language = "en") => {
    setIsLoading(true);
    setError(null);

    const result = await authService.forgotPassword(email, language);

    if (result.success) {
      // Store email for reset flow
      localStorage.setItem("resetEmail", email);
      setError(null);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const resetPassword = async (email, code, newPassword, language = "en") => {
    setIsLoading(true);
    setError(null);

    const result = await authService.resetPassword(
      email,
      code,
      newPassword,
      language,
    );

    if (result.success) {
      localStorage.removeItem("resetEmail");
      setError(null);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const resendCode = async (email, codeType = "verify", language = "en") => {
    setIsLoading(true);
    setError(null);

    const result = await authService.resendCode(email, codeType, language);

    if (result.success) {
      setError(null);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const googleSignIn = async (idToken) => {
    setIsLoading(true);
    setError(null);

    const result = await authService.googleSignIn(idToken);

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      localStorage.removeItem("pendingVerification");
      setError(null);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  // Clear error messages
  const clearError = () => setError(null);

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Auth functions
    signup,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendCode,
    googleSignIn,
    clearError,

    // Derived state
    isVerified: user?.is_verified || false,
    isPending: !isAuthenticated && localStorage.getItem("pendingVerification"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 * Usage: const { user, isAuthenticated, login, logout, error } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
