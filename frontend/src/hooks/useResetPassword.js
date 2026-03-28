/**
 * Hook for managing password reset completion flow.
 *
 * Handles password reset form submission with code, calls authService.resetPassword(),
 * manages loading/error state, and redirects to login on success.
 *
 * Usage:
 *   const { resetPassword, loading, error, success } = useResetPassword();
 *   <button onClick={() => resetPassword(code, password, passwordConfirm)}>Reset</button>
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../services/authService";

const useResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  /**
   * Reset password with verification code.
   *
   * @param {string} email - User email address
   * @param {string} code - 6-digit verification code
   * @param {string} newPassword - New password
   * @param {string} newPasswordConfirm - Confirm new password
   */
  const resetPassword = async (
    email,
    code,
    newPassword,
    newPasswordConfirm,
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!email || !code || !newPassword || !newPasswordConfirm) {
        throw new Error("All fields are required");
      }

      if (newPassword !== newPasswordConfirm) {
        throw new Error("Passwords do not match");
      }

      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      // Call backend reset password endpoint
      const result = await authService.resetPassword(
        code,
        newPassword,
        newPasswordConfirm,
        email,
      );

      if (result.success) {
        setSuccess(true);
        // Redirect to login page
        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Password reset successfully. Please login with your new password.",
            },
          });
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to reset password");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to reset password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    resetPassword,
    loading,
    error,
    success,
  };
};

export default useResetPassword;
