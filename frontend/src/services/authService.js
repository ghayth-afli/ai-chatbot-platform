/**
 * Authentication Service - API calls to /api/auth/* endpoints
 *
 * Handles all authentication-related API communication:
 * - User signup/login/logout
 * - Email verification
 * - Password reset flows
 * - Google OAuth
 * - Token refresh
 */

import axios from "axios";

// Get API base URL from environment or default
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const AUTH_API = `${API_BASE_URL}/api/auth`;

// Create axios instance with base config
const authClient = axios.create({
  baseURL: AUTH_API,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests
});

/**
 * Sign up new user
 * @param {string} email
 * @param {string} password
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} language - 'en' or 'ar'
 * @returns {Promise} {success, data, error}
 */
export const signup = async (
  email,
  password,
  firstName,
  lastName,
  language = "en",
) => {
  try {
    const response = await authClient.post("/signup/", {
      email,
      password,
      password_confirm: password,
      first_name: firstName,
      last_name: lastName,
      language,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: "Signup failed" },
    };
  }
};

/**
 * Log in user with email/password
 * @param {string} email
 * @param {string} password
 * @returns {Promise} {success, data, error}
 */
export const login = async (email, password) => {
  try {
    const response = await authClient.post("/login/", {
      email,
      password,
    });

    // Store user data in localStorage or context
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: "Login failed" },
    };
  }
};

/**
 * Log out user (clear cookies and local storage)
 * @returns {Promise} {success, error}
 */
export const logout = async () => {
  try {
    await authClient.post("/logout/");
    localStorage.removeItem("user");
    localStorage.removeItem("tokens");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: "Logout failed" },
    };
  }
};

/**
 * Get current authenticated user
 * @returns {Promise} {success, data, error}
 */
export const getCurrentUser = async () => {
  try {
    const response = await authClient.get("/me/");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: "Failed to get current user" },
    };
  }
};

/**
 * Verify email with code
 * @param {string} email
 * @param {string} code - 6-digit code
 * @returns {Promise} {success, data, error}
 */
export const verifyEmail = async (email, code) => {
  try {
    const response = await authClient.post("/verify-email/", {
      email,
      code,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: "Email verification failed" },
    };
  }
};

/**
 * Request password reset code
 * @param {string} email
 * @param {string} language - 'en' or 'ar'
 * @returns {Promise} {success, error}
 */
export const forgotPassword = async (email, language = "en") => {
  try {
    const response = await authClient.post("/forgot-password/", {
      email,
      language,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || {
        message: "Password reset request failed",
      },
    };
  }
};

/**
 * Reset password with code
 * @param {string} email
 * @param {string} code - 6-digit reset code
 * @param {string} newPassword
 * @param {string} language - 'en' or 'ar'
 * @returns {Promise} {success, error}
 */
export const resetPassword = async (
  email,
  code,
  newPassword,
  language = "en",
) => {
  try {
    const response = await authClient.post("/reset-password/", {
      email,
      code,
      new_password: newPassword,
      new_password_confirm: newPassword,
      language,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: "Password reset failed" },
    };
  }
};

/**
 * Resend verification or reset code
 * @param {string} email
 * @param {string} codeType - 'verify' or 'reset'
 * @param {string} language - 'en' or 'ar'
 * @returns {Promise} {success, error}
 */
export const resendCode = async (
  email,
  codeType = "verify",
  language = "en",
) => {
  try {
    const response = await authClient.post("/resend-code/", {
      email,
      code_type: codeType,
      language,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: "Failed to resend code" },
    };
  }
};

/**
 * Google OAuth sign in
 * @param {string} idToken - Google ID token from GoogleLogin
 * @returns {Promise} {success, data, error}
 */
export const googleSignIn = async (idToken) => {
  try {
    const response = await authClient.post("/google/", {
      id_token: idToken,
    });

    // Store user data
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || {
        message: "Google authentication failed",
      },
    };
  }
};

/**
 * Refresh access token (called by axios interceptor)
 * @returns {Promise} {success, token, error}
 */
export const refreshAccessToken = async () => {
  try {
    const response = await authClient.post("/refresh/");

    return {
      success: true,
      token: response.data.access_token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: "Token refresh failed" },
    };
  }
};

/**
 * Axios interceptor for silent token refresh on 401
 * [CLARIFICATION Q2]: Silently refreshes access token and retries request on 401
 *
 * NO USER INTERRUPTION - handles automatically
 * Flow: 401 error → refresh token on POST /api/auth/refresh →
 * new token set in Authorization header → retry original request
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return authClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResult = await refreshAccessToken();

        if (refreshResult.success) {
          const newToken = refreshResult.token;

          // Update Authorization header for future requests
          authClient.defaults.headers.common["Authorization"] =
            `Bearer ${newToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

          processQueue(null, newToken);

          // Retry original request with new token
          return authClient(originalRequest);
        } else {
          // Refresh failed - redirect to login
          processQueue(new Error("Token refresh failed"), null);
          window.location.href = "/login";
          return Promise.reject(error);
        }
      } catch (err) {
        processQueue(err, null);
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    // Other errors (403, 404, etc)
    if (error.response?.status === 403) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default authClient;
