/**
 * Email Verification Page
 *
 * Verifies user email with 6-digit code:
 * - Input field for code entry
 * - Countdown timer (10 minute TTL)
 * - Resend code functionality
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

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { verifyEmail, resendCode, isLoading } = useAuth();
  const isRTL = i18n.language === "ar";
  const logoSize = useResponsiveLogoSize();

  // Get email from previous navigation state
  const email =
    location.state?.email || localStorage.getItem("pendingVerification")?.email;

  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [justResent, setJustResent] = useState(false);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/auth/signup");
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

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Validate code format
  const validateCode = () => {
    const newErrors = {};

    if (!code) {
      newErrors.code = t("forms.codeRequired") || "Code is required";
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.code = t("forms.codeSixDigits") || "Code must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);

    // Clear error when user types
    if (errors.code) {
      setErrors((prev) => ({ ...prev, code: undefined }));
    }

    // Auto-submit if 6 digits entered
    if (value.length === 6) {
      handleSubmit(null, value);
    }
  };

  const handleSubmit = async (e, codeValue = null) => {
    if (e) e.preventDefault();

    const codeToVerify = codeValue || code;

    if (!validateCode()) {
      return;
    }

    const result = await verifyEmail(email, codeToVerify);

    if (result.success) {
      // Redirect to login or chat page
      navigate("/auth/login", {
        state: {
          message:
            t("auth.emailVerified") ||
            "Email verified successfully! Please log in.",
        },
      });
    } else {
      if (result.error?.code === "INVALID_CODE") {
        setErrors({
          code: t("auth.invalidCode") || "Invalid verification code",
        });
      } else if (result.error?.code === "TOKEN_EXPIRED") {
        setErrors({
          code:
            t("auth.codeExpired") ||
            "Code has expired. Please request a new one.",
        });
      } else {
        setErrors({
          submit: result.error?.message || t("auth.verificationFailed"),
        });
      }
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    const result = await resendCode(email, "verify", i18n.language);

    if (result.success) {
      setCode("");
      setTimeLeft(600); // Reset timer
      setCanResend(false);
      setJustResent(true);

      setTimeout(() => {
        setJustResent(false);
      }, 3000);
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
          <h1>{t("auth.verifyEmail") || "Verify Email"}</h1>
          <p>
            {t("auth.verifyEmailDescription") ||
              "Enter the 6-digit code we sent to your email"}
          </p>
        </div>

        {/* Email Display */}
        <div
          style={{
            padding: "1rem",
            background: "rgba(200, 255, 0, 0.08)",
            border: "1px solid rgba(200, 255, 0, 0.2)",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            color: "var(--paper)",
          }}
        >
          <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>
            {t("forms.emailAddress") || "Email"}:
          </div>
          <div style={{ fontWeight: "600" }}>{email}</div>
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

          {/* Success Message */}
          {justResent && (
            <div className="alert success">
              <span>✓</span>
              <div>
                {t("auth.codeSent") || "A new code has been sent to your email"}
              </div>
            </div>
          )}

          {/* Code Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="verification-code">
              {t("forms.verificationCode") || "Verification Code"}
              <span className="required">*</span>
            </label>
            <input
              type="text"
              name="code"
              id="verification-code"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              className="form-input"
              maxLength="6"
              required
              aria-label={t("forms.verificationCode") || "Verification Code"}
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
            {canResend && (
              <div style={{ marginTop: "0.5rem", color: "var(--spark)" }}>
                {t("auth.codeExpiredResend") ||
                  "Code expired. Please request a new one."}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={code.length < 6}
            className="mt-2"
          >
            {isLoading
              ? "Verifying..."
              : t("auth.verifyEmail") || "Verify Email"}
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

        {/* Alternative Actions */}
        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--muted)",
          }}
        >
          {t("auth.wrongEmail") || "Wrong email address?"}{" "}
          <button
            onClick={() => navigate("/auth/signup")}
            style={{
              background: "none",
              border: "none",
              color: "var(--volt)",
              cursor: "pointer",
              fontWeight: "600",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "var(--ice)")}
            onMouseLeave={(e) => (e.target.style.color = "var(--volt)")}
          >
            {t("auth.startOver") || "Start over"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
