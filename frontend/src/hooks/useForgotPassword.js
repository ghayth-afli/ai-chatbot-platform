/**
 * Hook for managing password reset request flow.
 *
 * Handles forgot password form submission, calls authService.forgotPassword(),
 * manages loading/error state, and redirects to reset page on success.
 *
 * Usage:
 *   const { forgotPassword, loading, error, sent } = useForgotPassword();
 *   <button onClick={() => forgotPassword(email)}>Reset Password</button>
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../services/authService";

const useForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  /**
   * Request password reset code for email.
   *
   * @param {string} email - User email address
   * @param {string} language - Language for email ('en' or 'ar')
   */
  const forgotPassword = async (email, language = "en") => {
    setLoading(true);
    setError(null);
    setSent(false);

    try {
      if (!email) {
        throw new Error("Email is required");
      }

      // Call backend forgot password endpoint
      const result = await authService.forgotPassword(email, language);

      if (result.success) {
        setSent(true);
        // Redirect to reset password page with email param
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to send reset code");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to send password reset code";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    forgotPassword,
    loading,
    error,
    sent,
  };
};

export default useForgotPassword;
