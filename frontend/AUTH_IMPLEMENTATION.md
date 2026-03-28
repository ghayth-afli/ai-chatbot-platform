# Frontend Authentication Implementation

This document explains the frontend authentication system for the AI Chat Platform.

## Overview

The authentication system includes:

- Email/password signup and login
- Email verification with 6-digit codes
- Password reset flows
- Google OAuth 2.0 integration (account linking)
- Silent token refresh on 401 errors [Q2]
- Full RTL support for Arabic [Q3]
- Persistent authentication state

## Architecture

### Services Layer (`src/services/authService.js`)

Core API integration with the backend. Exports functions for:

- `signup(email, password, firstName, lastName, language)` - Create new account
- `login(email, password)` - Authenticate user
- `logout()` - Sign out user
- `getCurrentUser()` - Get authenticated user
- `verifyEmail(email, code)` - Verify email with code
- `forgotPassword(email, language)` - Request password reset code
- `resetPassword(email, code, newPassword, language)` - Reset password
- `resendCode(email, codeType, language)` - Resend verification/reset code
- `googleSignIn(idToken)` - Google OAuth authentication
- `refreshAccessToken()` - Refresh JWT token (auto-called by interceptor)

**Key Feature**: Axios interceptor for silent token refresh:

- Catches 401 responses
- Automatically refreshes access token
- Retries original request
- Queues concurrent requests during refresh
- Redirects to login only if refresh fails

### State Management (`src/hooks/useAuth.jsx`)

Global authentication state via React Context. Provides:

- `user` - Current user object
- `isAuthenticated` - Boolean auth status
- `isLoading` - Loading during auth operations
- `error` - Error messages from failed operations
- Auth functions (signin, signup, logout, verify, reset, etc)
- `isPending` - True if signup pending verification
- `isVerified` - True if user's email is verified

Usage:

```javascript
const { user, isAuthenticated, login, logout, error } = useAuth();
```

### Components

#### `FormInput` - RTL-Aware Input Field

```javascript
<FormInput
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  required
/>
```

Features:

- Automatic RTL text alignment for Arabic
- Error message display
- Accessibility (labels, ARIA)
- Tailwind styling

#### `Button` - RTL-Aware Button

```javascript
<Button variant="primary" loading={isLoading} onClick={handleClick} fullWidth>
  Click Me
</Button>
```

Variants: `primary`, `secondary`, `danger`, `ghost`

#### `PrivateRoute` - Protected Routes

```javascript
<PrivateRoute>
  <ChatPage />
</PrivateRoute>
```

Redirects to login if not authenticated. Shows loading state while checking auth.

### Pages

#### `SignupPage` (`src/pages/auth/SignupPage.jsx`)

- Email validation
- Password strength requirements (8+ chars, uppercase, lowercase, number, special)
- Confirm password matching
- First/Last name input
- Redirect to verification on success
- Full RTL support

#### `LoginPage` (`src/pages/auth/LoginPage.jsx`)

- Email/password form
- Remember me option
- Forgot password link
- Google OAuth button (placeholder)
- Unverified user detection
- Full RTL support

#### `VerifyEmailPage` (`src/pages/auth/VerifyEmailPage.jsx`)

- 6-digit code input
- Auto-submit when 6 digits entered
- 10-minute countdown timer
- Resend code functionality
- Redirect to ChatPage on success
- Full RTL support

#### `ForgotPasswordPage` (`src/pages/auth/ForgotPasswordPage.jsx`)

- Email input
- Sends reset code via API
- Redirects to ResetPasswordPage
- Full RTL support

#### `ResetPasswordPage` (`src/pages/auth/ResetPasswordPage.jsx`)

- Code verification (6-digit)
- New password input with strength requirements
- Confirm password
- 10-minute countdown timer
- Resend code functionality
- Security warning
- Full RTL support

#### `ChatPage` (`src/pages/ChatPage.jsx`)

- Protected route (requires authentication)
- Shows current user info
- Language toggle (English/Arabic)
- Profile information display
- Logout button
- Full RTL support

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the frontend directory:

```bash
cp .env.example .env
```

Update with your backend URL:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Start Development Server

```bash
npm start
```

The app will be available at `http://localhost:3000`

## Usage Flows

### Sign Up Flow

1. User navigates to `/auth/signup`
2. Fills in email, password, name
3. Clicks "Sign Up"
4. App redirects to `/auth/verify-email`
5. User enters 6-digit code from email
6. App redirects to `/auth/login`

### Login Flow

1. User navigates to `/auth/login`
2. Enters email and password
3. Clicks "Log In"
4. If unverified, redirects to `/auth/verify-email`
5. If verified, sets auth cookies and redirects to `/chat`

### Password Reset Flow

1. User clicks "Forgot password?" on login page
2. Navigates to `/auth/forgot-password`
3. Enters email
4. Gets redirect to `/auth/reset-password`
5. Enters code and new password
6. Redirects to `/auth/login` with success message

### Google OAuth Flow

1. User clicks "Sign in with Google"
2. Completes Google authentication
3. App calls `/api/auth/google/` with idToken
4. Backend performs account linking or creation
5. Sets auth cookies
6. Redirects to `/chat`

## Internationalization

All text is translatable via react-i18next:

### English Translations: `src/i18n/en.json`

### Arabic Translations: `src/i18n/ar.json`

To add new translations, update both files:

```json
{
  "auth": {
    "newKey": "English text",
    ...
  }
}
```

### RTL Support [Q3]

RTL is automatic:

- Components use `dir={isRTL ? 'rtl' : 'ltr'}`
- Text alignment flips: `className={isRTL ? 'text-right' : 'text-left'}`
- Icon positions adjust for RTL
- Tailwind's RTL utilities work transparently

## Token Management

### Access Token

- 15-minute lifetime
- Stored in HTTP-only cookie
- Automatically included in requests (via `withCredentials`)

### Refresh Token

- 7-day lifetime
- Stored in HTTP-only cookie
- Used to get new access token on expiry

### Silent Refresh [Q2]

When API returns 401:

1. Axios interceptor catches response
2. Calls `/api/auth/refresh/` to get new token
3. Updates Authorization header
4. Retries original request
5. **User never sees login screen unless refresh truly fails**

## Error Handling

All errors follow standard format:

```javascript
{
  code: 'ERROR_CODE',
  message: 'User-facing message',
  details: {...}
}
```

Common error codes:

- `INVALID_CREDENTIALS` - Wrong email/password
- `EMAIL_EXISTS` - Email already registered
- `USER_NOT_VERIFIED` - Email not verified
- `INVALID_CODE` - Wrong verification code
- `TOKEN_EXPIRED` - Code/token expired
- `PASSWORD_INVALID` - Doesn't meet strength requirements

## Testing

Run tests:

```bash
npm test
```

Test files:

- `src/services/authService.test.js` - API integration tests
- `src/hooks/useAuth.test.jsx` - State management tests
- Individual component tests (to be added)

## Security Considerations

1. **HTTP-Only Cookies**: Tokens stored securely, inaccessible to JavaScript
2. **CSRF Protection**: Cookies include SameSite=Lax flag
3. **Secure Flag**: In production, cookies marked Secure (HTTPS only)
4. **Password Strength**: Minimum 8 chars + uppercase + lowercase + number + special
5. **Race Condition Prevention**: Backend uses atomic operations for code verification

## Troubleshooting

### CORS Errors

- Ensure backend has correct CORS settings
- Check that `REACT_APP_API_URL` matches backend URL
- Verify `withCredentials: true` in authService

### Token Refresh Loop

- Check that refresh endpoint returns valid token
- Verify authorization header format is `Bearer {token}`
- Ensure 401 handling doesn't have infinite loop

### RTL Not Working

- Check that `i18n.language` is correctly set to 'ar'
- Verify `dir` attribute is applied to containers
- Check Tailwind RTL configuration

### Emails Not Sending

- Check backend EMAIL settings
- In development, use console backend (check terminal)
- In production, verify SMTP credentials

## Next Steps

1. **Integrate Google OAuth Button** - Replace placeholder with actual Google Login button
2. **Add Social Account Linking UI** - Show linked accounts in profile
3. **Implement Account Recovery** - Security questions, backup codes
4. **Add Two-Factor Authentication** - Email/SMS based 2FA
5. **Profile Management** - Allow users to update name, picture
6. **Session Management** - View active sessions, logout from other devices

## Files Overview

```
frontend/src/
├── services/
│   ├── authService.js          # API integration
│   └── authService.test.js     # Service tests
├── hooks/
│   ├── useAuth.jsx             # Auth state & context
│   └── useAuth.test.jsx        # Hook tests
├── components/
│   ├── FormInput.jsx           # RTL input field
│   ├── Button.jsx              # RTL button
│   └── PrivateRoute.jsx        # Protected routes
├── pages/
│   ├── auth/
│   │   ├── SignupPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── VerifyEmailPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   └── ResetPasswordPage.jsx
│   └── ChatPage.jsx            # Protected page
├── config/
│   └── env.js                  # Environment config
├── i18n/
│   ├── en.json                 # English translations
│   └── ar.json                 # Arabic translations
├── App.jsx                     # Route setup
└── index.jsx                   # App entry point
```

## Support

For issues or questions, refer to:

- Backend docs: `backend/README.md`
- API specification: `specs/003-user-auth/`
- Implementation notes: `IMPLEMENTATION_SUMMARY.md`
