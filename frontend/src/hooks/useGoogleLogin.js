/**
 * Hook for managing Google OAuth login flow.
 *
 * Handles Google Sign-In success/error, calls authService.googleSignIn(),
 * manages loading/error state, and redirects to /chat on success.
 *
 * Usage:
 *   const { login, loading, error } = useGoogleLogin(onSuccess, onError);
 *   <GoogleLogin onSuccess={login} onError={onError} />
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../services/authService";

const useGoogleLogin = (onSuccess, onError) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /**
   * Handle successful Google login.
   *
   * @param {Object} response - Google login response with credential (JWT)
   */
  const login = async (response) => {
    setLoading(true);
    setError(null);

    try {
      const { credential } = response;

      if (!credential) {
        throw new Error("No credential in Google response");
      }

      // Call backend Google OAuth endpoint
      const result = await authService.googleSignIn(credential);

      if (result.user) {
        // Store user info and redirect
        if (typeof onSuccess === "function") {
          onSuccess(result);
        }
        navigate("/chat");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Google authentication failed";
      setError(errorMessage);

      if (typeof onError === "function") {
        onError({ error: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google login error.
   *
   * @param {Object} error - Google error response
   */
  const handleError = (errorResponse) => {
    console.error("Google login error:", errorResponse);
    setError("Google authentication failed");

    if (typeof onError === "function") {
      onError(errorResponse);
    }
  };

  return {
    login,
    handleError,
    loading,
    error,
  };
};

export default useGoogleLogin;
