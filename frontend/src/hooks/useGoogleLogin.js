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
import { useAuth } from "./useAuth";

const useGoogleLogin = (onSuccess, onError) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { googleSignIn } = useAuth();

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

      // Call auth context's googleSignIn which handles both API call and state update
      const result = await googleSignIn(credential);

      if (result.success && result.data && result.data.user) {
        // Callback notification
        if (typeof onSuccess === "function") {
          onSuccess(result.data);
        }
        navigate("/chat");
      } else {
        throw new Error(
          result.error?.message || "Google authentication failed",
        );
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
