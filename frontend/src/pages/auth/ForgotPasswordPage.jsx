/**
 * Forgot Password Page
 *
 * Initiates password reset flow:
 * - Email input
 * - Sends reset code to email
 * - Redirects to reset password page
 * - RTL support (Q3)
 * - Brand visual identity styling
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import useResponsiveLogoSize from "../../hooks/useResponsiveLogoSize";
import Button from "../../components/Button";
import Logo from "../../components/Logo";
import "./auth.css";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { forgotPassword, isLoading } = useAuth();
  const isRTL = i18n.language === "ar";
  const logoSize = useResponsiveLogoSize();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Email validation
  const validateEmail = () => {
    const newErrors = {};

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = t("forms.emailInvalid") || "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setEmail(e.target.value);

    // Clear error when user types
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    const result = await forgotPassword(email, i18n.language);

    if (result.success) {
      setSubmitted(true);

      // Redirect to reset password page after 3 seconds
      setTimeout(() => {
        navigate("/auth/reset-password", {
          state: { email },
        });
      }, 3000);
    } else {
      if (result.error?.code === "USER_NOT_FOUND") {
        setErrors({ email: t("auth.emailNotFound") || "Email not found" });
      } else {
        setErrors({ submit: result.error?.message || t("auth.resetFailed") });
      }
    }
  };

  return (
    <div className="auth-container" dir={isRTL ? "rtl" : "ltr"}>
      <div className="auth-bg" />

      <div className="auth-card">
        {/* Logo */}
        <div
          style={{
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Logo size={logoSize} />
        </div>

        {/* Header */}
        <div className="auth-header">
          <h1>{t("auth.forgotPassword") || "Forgot Password"}</h1>
          <p>
            {t("auth.forgotPasswordDescription") ||
              "Enter your email and we'll send you a reset code"}
          </p>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="alert success" style={{ marginBottom: "1.5rem" }}>
            <span>✓</span>
            <div>
              <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                {t("auth.resetCodeSent") || "Reset code sent!"}
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                {t("auth.resetCodeSentDescription") ||
                  "Check your email for the reset code. Redirecting..."}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Submit Error Alert */}
          {errors.submit && (
            <div className="alert error">
              <span>⚠️</span>
              <div>{errors.submit}</div>
            </div>
          )}

          {/* Email Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">
              {t("forms.email") || "Email Address"}
              <span className="required">*</span>
            </label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              placeholder="name@example.com"
              value={email}
              onChange={handleChange}
              className="form-input"
              autoComplete="email"
              required
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={submitted}
            className="mt-2"
          >
            {isLoading
              ? "Sending..."
              : t("auth.sendResetCode") || "Send Reset Code"}
          </Button>
        </form>

        {/* Info Box */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "rgba(0, 212, 232, 0.08)",
            border: "1px solid rgba(0, 212, 232, 0.3)",
            borderRadius: "12px",
            fontSize: "0.875rem",
            color: "var(--paper)",
          }}
        >
          <span style={{ fontWeight: "600", color: "var(--ice)" }}>
            💡 {t("auth.tip") || "Tip"}:
          </span>{" "}
          {t("auth.resetTip") ||
            "Check your spam folder if you don't see the email within a few minutes"}
        </div>

        {/* Back to Login */}
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link to="/auth/login" className="auth-footer-link">
            ← {t("auth.backToLogin") || "Back to Login"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
