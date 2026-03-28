/**
 * Signup Page
 *
 * User registration form with:
 * - Email validation
 * - Password strength requirements
 * - Name fields
 * - Language selection
 * - Google OAuth button
 * - RTL support (Q3)
 * - Redirect to verification page on success
 * - Brand visual identity styling
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from "../../components/GoogleOAuthMock";
import { useAuth } from "../../hooks/useAuth";
import useGoogleLogin from "../../hooks/useGoogleLogin";
import useResponsiveLogoSize from "../../hooks/useResponsiveLogoSize";
import Button from "../../components/Button";
import Logo from "../../components/Logo";
import "./auth.css";

const SignupPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { signup, error: authError, isLoading } = useAuth();
  const isRTL = i18n.language === "ar";
  const logoSize = useResponsiveLogoSize();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    passwordConfirm: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = t("forms.emailInvalid") || "Invalid email address";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName =
        t("forms.firstNameRequired") || "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName =
        t("forms.lastNameRequired") || "Last name is required";
    }

    const passwordReqs = validatePassword(formData.password);
    if (!passwordReqs.length) {
      newErrors.password =
        t("forms.passwordTooShort") || "Password must be at least 8 characters";
    } else if (
      !passwordReqs.uppercase ||
      !passwordReqs.lowercase ||
      !passwordReqs.number ||
      !passwordReqs.special
    ) {
      newErrors.password =
        t("forms.passwordWeak") ||
        "Password must contain uppercase, lowercase, number, and special character";
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm =
        t("forms.passwordMismatch") || "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await signup(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      i18n.language,
    );

    if (result.success) {
      // Redirect to email verification page
      navigate("/auth/verify-email", {
        state: { email: formData.email },
      });
    } else {
      // Error will be displayed from context
      if (result.error?.code) {
        setErrors({ submit: result.error.message });
      }
    }
  };

  const { login: googleLogin } = useGoogleLogin(
    (result) => {
      // Success callback - auto-login skips verification for Google OAuth
      navigate("/chat");
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
          <h1>{t("auth.signup") || "Create Account"}</h1>
          <p>
            {t("auth.signupDescription") || "Join us to start your journey"}
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

          {/* Name Fields */}
          <div className="form-group side-by-side">
            <div>
              <label className="form-label">
                {t("forms.firstName") || "First Name"}
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                required
              />
              {errors.firstName && (
                <span className="form-error">{errors.firstName}</span>
              )}
            </div>
            <div>
              <label className="form-label">
                {t("forms.lastName") || "Last Name"}
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                required
              />
              {errors.lastName && (
                <span className="form-error">{errors.lastName}</span>
              )}
            </div>
          </div>

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

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="password-strength">
                  {Object.entries(validatePassword(formData.password)).map(
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
                  {Object.entries(validatePassword(formData.password)).map(
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
            <label className="form-label">
              {t("forms.confirmPassword") || "Confirm Password"}
              <span className="required">*</span>
            </label>
            <input
              type="password"
              name="passwordConfirm"
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.passwordConfirm && (
              <span className="form-error">{errors.passwordConfirm}</span>
            )}
          </div>

          {/* Sign Up Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            className="mt-2"
          >
            {isLoading ? "Creating account..." : t("auth.signup") || "Sign Up"}
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
            text="signup_with"
            theme="outline"
            width="100%"
          />
        </div>

        {/* Footer - Login Link */}
        <div className="auth-footer">
          <p>
            {t("auth.haveAccount") || "Already have an account?"}{" "}
            <Link to="/auth/login" className="auth-footer-link">
              {t("auth.login") || "Log In"}
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="demo-credentials">
          <div className="demo-credentials-title">
            {t("auth.demoCredentials") || "Demo Credentials"}
          </div>
          <p>Email: demo@example.com</p>
          <p>Password: DemoPass123!</p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
