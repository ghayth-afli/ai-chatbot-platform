# Frontend Authentication Implementation

## Overview

This document describes the frontend authentication implementation using React hooks, context, and axios interceptors.

## Architecture

### Context & Hooks

**AuthContext** (`hooks/useAuth.jsx`):

- Global state management for authentication
- Provides `useAuth()` hook to access auth state anywhere
- Manages user data, loading states, and error messages

### Authentication Hooks

**useAuth()** - Main authentication hook

```javascript
const {
  user, // Current user object or null
  isAuthenticated, // Boolean authentication status
  isLoading, // Loading during auth operations
  error, // Error message if any
  login, // Function: login(email, password) → Promise
  signup, // Function: signup(data) → Promise
  logout, // Function: logout() → Promise
  verifyEmail, // Function: verifyEmail(email, code) → Promise
  resendCode, // Function: resendCode(email) → Promise
  forgotPassword, // Function: forgotPassword(email) → Promise
  resetPassword, // Function: resetPassword(email, code, pass) → Promise
  googleSignIn, // Function: googleSignIn(idToken) → Promise
} = useAuth();
```

**useGoogleLogin.js** - Google OAuth handler

```javascript
const { login, handleError, loading, error } = useGoogleLogin(
  onSuccess,
  onError,
);
// login(googleResponse) - handle Google token response
```

**useForgotPassword.js** - Password recovery

```javascript
const { forgotPassword, loading, error, sent } = useForgotPassword();
// forgotPassword(email) - request reset code
```

**useResetPassword.js** - Password reset completion

```javascript
const { resetPassword, loading, error, success } = useResetPassword();
// resetPassword(email, code, newPassword, confirmPassword)
```

## Services

**authService.js** - API communication

```javascript
// Authentication endpoints
signup(email, password, firstName, lastName, language);
login(email, password);
logout();
getCurrentUser();
verifyEmail(email, code);
resendCode(email, language);
forgotPassword(email, language);
resetPassword(code, newPassword, confirmPassword, email);
googleSignIn(idToken);

// Token management
getAccessToken(); // Get token from localStorage
setAccessToken(token); // Store token
refreshAccessToken(); // Silently refresh token on 401
```

### Axios Interceptors

**Response Interceptor** (`services/authService.js`):

```javascript
// On 401 (Unauthorized):
// 1. Call refreshAccessToken()
// 2. Update Authorization header
// 3. Retry original request automatically
// 4. No user interruption

// On 403 (Forbidden):
// 1. Redirect to /login
// 2. Show error message
```

## Pages

### LoginPage (`pages/auth/LoginPage.jsx`)

**Features**:

- Email & password input fields
- "Remember me" checkbox
- "Forgot password?" link → /forgot-password
- "Sign in with Google" button
- Email/password validation
- Error display
- RTL support (Q3)

**Flow**:

```
1. User enters email + password
2. Click "Log In" button
3. Validates: email format, password not empty
4. Calls useAuth().login(email, password)
5. On success:
   - User state set
   - Redirect to /chat
6. On error:
   - Display error message
   - Examples: INVALID_CREDENTIALS, USER_NOT_VERIFIED, rate limit
```

### SignupPage (`pages/auth/SignupPage.jsx`)

**Features**:

- Email, password, confirm password input
- First name, last name input
- "Sign in with Google" button
- Password strength validation
- RTL support

**Flow**:

```
1. User enters email + details
2. Validates: email format, password strength, passwords match
3. Calls useAuth().signup(data)
4. On success:
   - Redirect to /verify-email with email param
   - Show "Verification code sent" message
5. On error:
   - Display error message
   - Examples: EMAIL_EXISTS, PASSWORD_INVALID
```

### VerifyEmailPage (`pages/auth/VerifyEmailPage.jsx`)

**Features**:

- Display email address
- 6-digit code input
- "Resend code" button
- Code validation (6 digits only)
- Timer countdown (10 minutes)
- RTL support

**Flow**:

```
1. Page receives email from state
2. Display email: "Verification code sent to ..."
3. User enters code
4. Click "Verify" button
5. Calls useAuth().verifyEmail(email, code)
6. On success:
   - Redirect to /chat
   - Show success message
7. On error:
   - Display error (INVALID_CODE, TOKEN_EXPIRED)
8. "Resend code" button:
   - Calls useAuth().resendCode(email)
   - Rate limited: 3/60min
```

### ForgotPasswordPage (`pages/auth/ForgotPasswordPage.jsx`)

**Features**:

- Email input field
- "Send Reset Code" button
- Success message display
- Auto-navigate to /reset-password
- RTL support

**Flow**:

```
1. User enters email
2. Click "Reset Password" button
3. Calls useForgotPassword().forgotPassword(email)
4. On success:
   - Show "Reset code sent to your email"
   - Auto-redirect to /reset-password after 2 seconds
5. On error:
   - Display error (EMAIL_NOT_FOUND)
```

### ResetPasswordPage (`pages/auth/ResetPasswordPage.jsx`)

**Features**:

- 6-digit code input (digits only)
- New password input with strength validation
- Confirm password input
- "Resend code" button with timer
- Password requirements display
- RTL support

**Flow**:

```
1. Page receives email from params or localStorage
2. User enters code
3. User enters new password (validates strength)
4. User confirms password (must match)
5. Click "Reset Password" button
6. Calls useResetPassword().resetPassword(email, code, password, confirm)
7. On success:
   - Show "Password reset successfully"
   - Redirect to /login with message
8. On error:
   - Display specific error (INVALID_CODE, TOKEN_EXPIRED, PASSWORD_INVALID)
9. "Resend code" button:
   - Rate limited: 3/60min
```

### ChatPage (`pages/ChatPage.jsx`)

**Features**:

- Protected route (AuthGuard wrapper)
- Display user name/email
- Chat interface
- Logout button
- Auto-redirect to /login if not authenticated

**Flow**:

```
1. Component mounts
2. AuthGuard checks isAuthenticated
3. If false → redirect to /login
4. If true → render chat interface
5. Display user info from useAuth().user
6. Logout button:
   - Calls useAuth().logout()
   - Clears cookies
   - Clears localStorage
   - Redirects to /landing
   - Auto-logout in other tabs (storage event)
```

## Components

**AuthGuard** (`components/AuthGuard.jsx`)

```javascript
<AuthGuard>
  <ChatPage /> // Protected component
</AuthGuard>

// Behavior:
// - If user authenticated: render children
// - If not authenticated: redirect to /login?returnUrl=/current-page
// - If loading: show loading spinner
```

**FormInput** (`components/FormInput.jsx`)

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

// Props:
// - label: Display label
// - name: Input name
// - type: HTML input type
// - value: Controlled value
// - onChange: Change handler
// - error: Error message to display
// - required: Show required indicator
```

**Button** (`components/Button.jsx`)

```javascript
<Button
  type="submit"
  variant="primary" // or "secondary", "danger"
  fullWidth
  loading={isLoading}
  disabled={disabled}
>
  Log In
</Button>

// Props:
// - loading: Show spinner, disable button
// - disabled: Disable button interaction
// - variant: Color scheme (primary blue, secondary gray, danger red)
```

## Error Handling

### Error Codes

```javascript
// Authentication Errors
INVALID_CREDENTIALS    → 401, "Email or password is incorrect"
USER_NOT_VERIFIED      → 401, "Please verify your email first"
USER_NOT_FOUND         → 404, "User not found"
EMAIL_EXISTS           → 400, "Email already in use"

// Verification Errors
INVALID_CODE           → 400, "Code is invalid or has been used"
TOKEN_EXPIRED          → 400, "Code has expired (10 minutes)"
TOKEN_ALREADY_USED     → 400, "This code has already been used"

// Password Errors
PASSWORD_INVALID       → 400, "Password must meet requirements"
PASSWORD_MISMATCH      → 400, "Passwords do not match"

// Rate Limiting
RATE_LIMIT_EXCEEDED    → 429, "Too many attempts. Try again later"

// OAuth Errors
GOOGLE_AUTH_FAILED     → 400, "Google authentication failed"
TOKEN_VERIFICATION_FAILED → 400, "Token verification failed"

// General Errors
VALIDATION_ERROR       → 400, Details provided in error message
INTERNAL_ERROR         → 500, "Something went wrong. Please try again"
```

### Error Display

```javascript
// In components, display user-friendly messages:
if (error) {
  <div className="alert alert-error">
    {error.includes("RATE_LIMIT") &&
      "Too many attempts. Please try again in 15 minutes."}
    {error.includes("USER_NOT_VERIFIED") && "Please verify your email first."}
    {error.includes("INVALID_CODE") && "The code you entered is invalid."}
    {/* Generic fallback */}
    {error}
  </div>;
}
```

## Testing

### Unit Tests

```bash
npm run test -- --testPathPattern=pages/auth/LoginPage
npm run test -- --testPathPattern=hooks/useAuth
npm run test -- --testPathPattern=services/authService
```

### Test Scenarios

```javascript
// Component rendering
- LoginPage renders with email/password fields ✓
- SignupPage renders with all required fields ✓
- ForgotPasswordPage renders email input ✓
- ResetPasswordPage renders code + password inputs ✓

// Form interactions
- Email validation shows error on invalid format ✓
- Password strength validator enforces requirements ✓
- Form submission calls auth functions ✓

// Error handling
- Invalid credentials show INVALID_CREDENTIALS error ✓
- USER_NOT_VERIFIED shows message ✓
- Rate limit shows "too many attempts" ✓

// Navigation
- Successful login redirects to /chat ✓
- Logout redirects to /landing ✓
- Successful signup redirects to /verify-email ✓
- Forgot password redirects to reset page ✓

// State management
- User state persists in localStorage ✓
- useAuth() hook provides user to components ✓
- Logout clears all state ✓
```

### E2E Tests

```bash
npm run test:e2e
```

**Scenarios**:

- Complete signup → verify → login flow
- Login with invalid credentials
- Forgot password → reset password → login with new password
- Google OAuth button click and flow
- Multi-tab logout sync
- Cookie security (JavaScript cannot read HttpOnly)

## Internationalization (i18n)

**Language Support**: English (en) & Arabic (ar)

**RTL Support** (Q3):

```javascript
// In components:
const { i18n } = useTranslation();
const isRTL = i18n.language === "ar";

// Apply to forms:
<form dir={isRTL ? "rtl" : "ltr"}>{/* Form content */}</form>;

// Tailwind RTL utilities:
// ml-4 (margin-left) → auto-flips to mr-4 in RTL
// text-left → auto-flips to text-right in RTL
```

**Translation Keys**:

```javascript
// Buttons
auth.login = "تسجيل دخول";
auth.signup = "إنشاء حساب";
auth.logout = "تسجيل خروج";
auth.resetPassword = "إعادة تعيين كلمة المرور";

// Forms
forms.email = "عنوان البريد الإلكتروني";
forms.password = "كلمة المرور";
forms.passwordRequired = "كلمة المرور مطلوبة";
forms.codeRequired = "الكود مطلوب";

// Errors
auth.invalidCredentials = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
auth.emailNotFound = "لم يتم العثور على البريد الإلكتروني";
```

## Troubleshooting

### Login redirect loops

**Problem**: User logs in but gets redirected back to login

**Causes**:

- Token expired, refresh failed
- useAuthStatus hook checking `/me/` endpoint fails
- Cookie not being sent

**Solution**:

- Check browser DevTools → Network tab
- Verify access_token cookie is being sent
- Check /me endpoint returns 200 instead of 401

### "Cannot find module" errors

**Problem**: Import errors in components

**Causes**:

- Files not created yet
- Wrong import path
- Filename typo

**Solution**:

- Check file exists: `ls frontend/src/pages/auth/LoginPage.jsx`
- Verify import path matches actual location
- Check for JS vs JSX extension

### Axios interceptor not refreshing token

**Problem**: Getting 401 errors even though refresh token exists

**Causes**:

- Interceptor not registered
- refreshAccessToken() returning null
- Backend /refresh endpoint not working

**Solution**:

```javascript
// Check interceptor is registered in App.jsx
import { setupAxiosInterceptors } from "./services/authService";

useEffect(() => {
  setupAxiosInterceptors();
}, []);
```

### Multi-tab logout not working

**Problem**: Logout in one tab doesn't affect other tabs

**Causes**:

- Storage event listener not registered
- Event not firing across tabs
- Same-origin policy blocking

**Solution**:

- Check useAuth.jsx has storage event listener
- Both tabs must be same origin (localhost:3000)
- Check browser console for errors

## Performance

### Optimization Tips

```javascript
// 1. Memoize auth callbacks
const login = useCallback(async (email, password) => {
  // login logic
}, []);

// 2. Lazy load heavy auth pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));

// 3. Cache user data in localStorage
localStorage.setItem("user", JSON.stringify(user));

// 4. Avoid unnecessary re-renders
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

## Future Enhancements

- [ ] Two-Factor Authentication (2FA via SMS/TOTP)
- [ ] Biometric login (fingerprint, Face ID)
- [ ] Social login (Facebook, GitHub, Microsoft)
- [ ] Session management dashboard
- [ ] Login history view
- [ ] Device management
