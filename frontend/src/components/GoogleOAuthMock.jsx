/**
 * Mock Google OAuth Provider
 *
 * This is a fallback implementation used when @react-oauth/google module is unavailable.
 * In production, this should be replaced with the real GoogleOAuthProvider from the package.
 *
 * Usage:
 * - Replace imports of @react-oauth/google with imports from this file
 * - The mock provides the same interface for testing and development
 */

import React from "react";

/**
 * MockGoogleOAuthProvider
 *
 * Wrapper component that provides a mock Google OAuth context.
 * Implements the same interface as the real GoogleOAuthProvider.
 */
export const GoogleOAuthProvider = ({ children, clientId }) => {
  return <>{children}</>;
};

/**
 * MockGoogleLogin
 *
 * Mock Google Login button component with brand styling.
 * In production, this would render a real Google Sign-In button.
 * For testing, it renders a beautifully styled button that matches the brand identity.
 */
export const GoogleLogin = ({
  onSuccess,
  onError,
  text = "signin_with",
  locale = "en_US",
  ...props
}) => {
  const handleClick = () => {
    // Mock implementation - returns a mock credential
    const mockCredential = {
      token: "mock-jwt-token-from-google",
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    };

    if (onSuccess) {
      onSuccess({ credential: mockCredential });
    }
  };

  const buttonText =
    text === "signin_with" ? "Sign in with Google" : "Sign up with Google";

  return (
    <button
      data-testid="mock-google-login"
      onClick={handleClick}
      style={{
        width: "100%",
        padding: "0.875rem 1rem",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "10px",
        color: "#F5F3EF",
        fontFamily: "'Syne', sans-serif",
        fontSize: "0.9375rem",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.borderColor = "#C8FF00";
        e.currentTarget.style.boxShadow = "0 0 12px rgba(200, 255, 0, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    >
      {/* Google Icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Google "G" Logo */}
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>

      {/* Button Text */}
      <span>{buttonText}</span>
    </button>
  );
};

/**
 * GoogleOAuthContext
 *
 * Mock context that can be used to manage Google OAuth state.
 */
export const GoogleOAuthContext = React.createContext(null);

/**
 * useGoogleLogin
 *
 * Mock hook for Google Login functionality.
 * Returns a mock login function.
 */
export const useGoogleLogin = (options) => {
  return async (codeResponse) => {
    // Mock implementation
    console.log("Mock Google Login:", codeResponse);
    return {
      token: "mock-token",
      profile: {
        id: "mock-user-id",
        email: "mock@example.com",
      },
    };
  };
};

export default GoogleOAuthProvider;
