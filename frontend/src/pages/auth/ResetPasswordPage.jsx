/**
 * Reset Password Page
 *
 * Completes password reset flow:
 * - Code verification (from email)
 * - New password input with strength requirements
 * - Password confirmation
 * - RTL support (Q3)
 * - Brand visual identity styling
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import useResponsiveLogoSize from "../../hooks/useResponsiveLogoSize";
import Button from "../../components/Button";
import Logo from "../../components/Logo";
import "./auth.css";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { resetPassword, resendCode, isLoading } = useAuth();
  const isRTL = i18n.language === "ar";
  const logoSize = useResponsiveLogoSize();

  // Get email from previous navigation state or localStorage
  const email = location.state?.email || localStorage.getItem("resetEmail");

  const [formData, setFormData] = useState({
    code: "",
    newPassword: "",
    newPasswordConfirm: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/auth/forgot-password");
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Password strength validation
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    return requirements;
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.code) {
      newErrors.code = t("forms.codeRequired") || "Code is required";
    } else if (!/^\d{6}$/.test(formData.code)) {
      newErrors.code = t("forms.codeSixDigits") || "Code must be 6 digits";
    }

    const passwordReqs = validatePassword(formData.newPassword);
    if (!passwordReqs.length) {
      newErrors.newPassword =
        t("forms.passwordTooShort") || "Password must be at least 8 characters";
    } else if (
      !passwordReqs.uppercase ||
      !passwordReqs.lowercase ||
      !passwordReqs.number ||
      !passwordReqs.special
    ) {
      newErrors.newPassword =
        t("forms.passwordWeak") ||
        "Password must contain uppercase, lowercase, number, and special character";
    }

    if (formData.newPassword !== formData.newPasswordConfirm) {
      newErrors.newPasswordConfirm =
        t("forms.passwordMismatch") || "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Limit code to 6 digits
    if (name === "code") {
      const digitValue = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: digitValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await resetPassword(
      email,
      formData.code,
      formData.newPassword,
      i18n.language,
    );

    if (result.success) {
      // Redirect to login with success message
      navigate("/auth/login", {
        state: {
          message:
            t("auth.passwordResetSuccess") ||
            "Password reset successfully! Please log in.",
        },
      });
    } else {
      if (result.error?.code === "INVALID_CODE") {
        setErrors({ code: t("auth.invalidCode") || "Invalid or expired code" });
      } else if (result.error?.code === "TOKEN_EXPIRED") {
        setErrors({
          code:
            t("auth.codeExpired") ||
            "Code has expired. Please request a new one.",
        });
      } else {
        setErrors({ submit: result.error?.message || t("auth.resetFailed") });
      }
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    const result = await resendCode(email, "reset", i18n.language);

    if (result.success) {
      setFormData((prev) => ({ ...prev, code: "" }));
      setTimeLeft(600);
      setCanResend(false);
    } else {
      setErrors({ submit: result.error?.message || t("auth.resendFailed") });
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
          <h1>{t("auth.resetPassword") || "Reset Password"}</h1>
          <p>
            {t("auth.resetPasswordDescription") ||
              "Enter the code and your new password"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Submit Error Alert */}
          {errors.submit && (
            <div className="alert error">
              <span>⚠️</span>
              <div>{errors.submit}</div>
            </div>
          )}

          {/* Security Warning */}
          <div
            style={{
              padding: "1rem",
              background: "rgba(255, 77, 109, 0.08)",
              border: "1px solid rgba(255, 77, 109, 0.3)",
              borderRadius: "12px",
              fontSize: "0.875rem",
              color: "var(--paper)",
            }}
          >
            <span style={{ fontWeight: "600", color: "var(--spark)" }}>
              ⚠️ {t("auth.security") || "Security"}:
            </span>{" "}
            {t("auth.securityWarning") ||
              "Never share this code with anyone. We will never ask for it via email or phone."}
          </div>

          {/* Email Display */}
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(200, 255, 0, 0.08)",
              border: "1px solid rgba(200, 255, 0, 0.2)",
              borderRadius: "10px",
              fontSize: "0.875rem",
              color: "var(--muted)",
            }}
          >
            {email}
          </div>

          {/* Code Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="reset-code">
              {t("forms.resetCode") || "Reset Code"}
              <span className="required">*</span>
            </label>
            <input
              id="reset-code"
              type="text"
              name="code"
              placeholder="000000"
              value={formData.code}
              onChange={handleChange}
              className="form-input"
              maxLength="6"
              required
            />
            {errors.code && <span className="form-error">{errors.code}</span>}
          </div>

          {/* Timer */}
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(255, 165, 0, 0.08)",
              border: "1px solid rgba(255, 165, 0, 0.2)",
              borderRadius: "10px",
              fontSize: "0.875rem",
              color: "var(--paper)",
            }}
          >
            <span style={{ fontWeight: "600" }}>
              {t("auth.expiresIn") || "Code expires in"}:
            </span>{" "}
            <span style={{ fontFamily: "'Space Mono', monospace" }}>
              {formatTime(Math.max(0, timeLeft))}
            </span>
          </div>

          {/* New Password */}
          <div className="form-group password-relative">
            <label className="form-label" htmlFor="new-password">
              {t("forms.newPassword") || "New Password"}
              <span className="required">*</span>
            </label>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              name="newPassword"
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={handleChange}
              className="form-input"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
            {errors.newPassword && (
              <span className="form-error">{errors.newPassword}</span>
            )}

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="password-strength">
                  {Object.entries(validatePassword(formData.newPassword)).map(
                    ([req, valid]) => (
                      <div
                        key={req}
                        className={`strength-bar ${
                          !valid
                            ? "opacity-30"
                            : req === "length"
                              ? "weak"
                              : req === "special"
                                ? "fair"
                                : "strong"
                        }`}
                      />
                    ),
                  )}
                </div>
                <div className="mt-2 text-xs space-y-1">
                  {Object.entries(validatePassword(formData.newPassword)).map(
                    ([req, valid]) => (
                      <div key={req} className="flex items-center gap-2">
                        <span className={valid ? "text-volt" : "text-muted"}>
                          {valid ? "✓" : "○"}
                        </span>
                        <span className={valid ? "text-paper" : "text-muted"}>
                          {t(`forms.passwordReq.${req}`) || req}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              {t("forms.confirmPassword") || "Confirm Password"}
              <span className="required">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              name="newPasswordConfirm"
              placeholder="••••••••"
              value={formData.newPasswordConfirm}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.newPasswordConfirm && (
              <span className="form-error">{errors.newPasswordConfirm}</span>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            className="mt-2"
          >
            {isLoading
              ? "Resetting..."
              : t("auth.resetPassword") || "Reset Password"}
          </Button>
        </form>

        {/* Resend Code Section */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--muted)",
              marginBottom: "1rem",
            }}
          >
            {t("auth.didNotReceiveCode") || "Didn't receive the code?"}
          </p>

          <Button
            type="button"
            variant={canResend ? "secondary" : "ghost"}
            fullWidth
            onClick={handleResendCode}
            disabled={!canResend || isLoading}
          >
            {canResend
              ? t("auth.resendCode") || "Resend Code"
              : `${t("auth.resendIn") || "Resend in"} ${formatTime(timeLeft)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
