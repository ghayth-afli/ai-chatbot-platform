/**
 * Google OAuth configuration module.
 *
 * Exports GOOGLE_CLIENT_ID from environment variables for use in
 * GoogleOAuthProvider and GoogleLogin components.
 */

export const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

/**
 * Google OAuth configuration object.
 *
 * Contains settings for Google Sign-In integration including client ID
 * and OAuth scopes.
 */
export const googleOAuthConfig = {
  clientId: GOOGLE_CLIENT_ID,
  scope: ["profile", "email"],
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
};

export default googleOAuthConfig;
