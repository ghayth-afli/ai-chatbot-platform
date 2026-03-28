/**
 * Environment Configuration
 *
 * Centralizes all environment-specific settings
 * - API endpoints
 * - Authentication settings
 * - Feature flags
 */

const env = process.env.NODE_ENV || "development";

const config = {
  development: {
    API_URL: process.env.REACT_APP_API_URL || "http://localhost:8000",
    API_TIMEOUT: 30000,
    ENABLE_LOGS: true,
    ENABLE_MOCK_AUTH: false,
    GOOGLE_OAUTH_CLIENT_ID:
      process.env.REACT_APP_GOOGLE_CLIENT_ID ||
      "894485540625-8vc00utfn2lclcp82uc5p3t4do2a2f66.apps.googleusercontent.com",
  },
  staging: {
    API_URL:
      process.env.REACT_APP_API_URL || "https://staging-api.nexus-chat.ai",
    API_TIMEOUT: 30000,
    ENABLE_LOGS: true,
    ENABLE_MOCK_AUTH: false,
    GOOGLE_OAUTH_CLIENT_ID:
      process.env.REACT_APP_GOOGLE_CLIENT_ID ||
      "894485540625-8vc00utfn2lclcp82uc5p3t4do2a2f66.apps.googleusercontent.com",
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL || "https://api.nexus-chat.ai",
    API_TIMEOUT: 30000,
    ENABLE_LOGS: false,
    ENABLE_MOCK_AUTH: false,
    GOOGLE_OAUTH_CLIENT_ID:
      process.env.REACT_APP_GOOGLE_CLIENT_ID ||
      "894485540625-8vc00utfn2lclcp82uc5p3t4do2a2f66.apps.googleusercontent.com",
  },
};

export default config[env];
