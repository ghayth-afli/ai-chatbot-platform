/**
 * Login Page
 *
 * User authentication form with:
 * - Email and password input
 * - Remember me option
 * - Forgot password link
 * - Google OAuth button
 * - RTL support (Q3)
 * - Error handling for unverified users
 * - Brand visual identity styling
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from "../../components/GoogleOAuthMock";
import { useAuth } from "../../hooks/useAuth";
import useGoogleLogin from "../../hooks/useGoogleLogin";
import useResponsiveLogoSize from "../../hooks/useResponsiveLogoSize";
import Button from "../../components/Button";
import Logo from "../../components/Logo";
import "./auth.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { login, error: authError, isLoading, isAuthenticated } = useAuth();
  const isRTL = i18n.language === "ar";
  const logoSize = useResponsiveLogoSize();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/chat";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = t("forms.emailInvalid") || "Invalid email address";
    }

    if (!formData.password) {
      newErrors.password =
        t("forms.passwordRequired") || "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    if (type === "checkbox") {
      setRememberMe(fieldValue);
    } else {
      setFormData((prev) => ({ ...prev, [name]: fieldValue }));
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

    const result = await login(formData.email, formData.password);

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberedEmail", formData.email);
      }

      // Clear form and errors on successful login
      setFormData({ email: "", password: "" });
      setErrors({});

      // Redirect to chat (or intended destination)
      const from = location.state?.from?.pathname || "/chat";
      navigate(from, { replace: true });
    } else {
      // Handle backend errors
      const error = result.error;

      if (error?.code === "USER_NOT_VERIFIED") {
        // Redirect to email verification with email
        navigate("/auth/verify-email", {
          state: { email: formData.email },
        });
      } else if (error?.details?.errors) {
        // Handle field-specific validation errors
        const newErrors = {};
        const backendErrors = error.details.errors;

        if (backendErrors.email) {
          newErrors.email = Array.isArray(backendErrors.email)
            ? backendErrors.email[0]
            : backendErrors.email;
        }
        if (backendErrors.password) {
          newErrors.password = Array.isArray(backendErrors.password)
            ? backendErrors.password[0]
            : backendErrors.password;
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        } else {
          setErrors({ submit: error.message || t("auth.loginFailed") });
        }
      } else {
        // Generic error
        setErrors({ submit: error?.message || t("auth.loginFailed") });
      }
    }
  };

  const { login: googleLogin } = useGoogleLogin(
    (result) => {
      // Success callback
      const from = location.state?.from?.pathname || "/chat";
      navigate(from);
    },
    (error) => {
      // Error callback
      setErrors({ submit: error.error || t("auth.googleFailed") });
    },
  );

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
          <h1>{t("auth.login") || "Welcome Back"}</h1>
          <p>
            {t("auth.loginDescription") ||
              "Sign in to your account to continue"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Submit Error Alert */}
          {(authError || errors.submit) && (
            <div className="alert error">
              <span>⚠️</span>
              <div>{errors.submit || authError?.message}</div>
            </div>
          )}

          {/* Email Input */}
          <div className="form-group">
            <label className="form-label">
              {t("forms.email") || "Email Address"}
              <span className="required">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              autoComplete="email"
              required
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Password Input */}
          <div className="form-group password-relative">
            <label className="form-label">
              {t("forms.password") || "Password"}
              <span className="required">*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="helper-text">
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span className="checkbox-label">
                {t("auth.rememberMe") || "Remember me"}
              </span>
            </label>
            <Link to="/auth/forgot-password" className="helper-link">
              {t("auth.forgotPassword") || "Forgot password?"}
            </Link>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            className="mt-2"
          >
            {isLoading ? "Signing in..." : t("auth.login") || "Sign In"}
          </Button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span className="divider-text">{t("auth.or") || "Or"}</span>
        </div>

        {/* Google Sign In */}
        <div className="mb-6">
          <GoogleLogin
            onSuccess={googleLogin}
            onError={() =>
              setErrors({
                submit:
                  t("auth.googleFailed") || "Google authentication failed",
              })
            }
            text="signin_with"
            theme="outline"
            width="100%"
          />
        </div>

        {/* Footer - Sign Up Link */}
        <div className="auth-footer">
          <p>
            {t("auth.noAccount") || "Don't have an account?"}{" "}
            <Link to="/auth/signup" className="auth-footer-link">
              {t("auth.signup") || "Sign Up"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
