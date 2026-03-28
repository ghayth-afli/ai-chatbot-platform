# Feature Specification: User Authentication & Authorization

**Feature Branch**: `003-user-auth`  
**Created**: March 28, 2026  
**Status**: Draft  
**Input**: Phase 3 — Authentication & Authorization Specification

## Clarifications

### Session 2026-03-28

- **Q1**: Account linking strategy (email signup + Google OAuth same email) → **A: Merge accounts** (one user record, both auth methods supported)
- **Q2**: Token refresh behavior on access token expiry → **A: Auto-refresh silently** (axios interceptor retries request transparently)
- **Q3**: RTL form layout for Arabic UI → **A: CSS-driven RTL only** (single HTML structure, `dir="rtl"` + CSS handles flipping, no component duplication)
- **Q4**: Concurrent verification code submission race condition → **A: First wins, second fails** (first tab uses code successfully, second tab gets `INVALID_CODE` error)

---

## User Scenarios & Testing

### User Story 1 - Email & Password Authentication (Priority: P1)

Users need a secure way to create accounts and log in with email and password credentials. This is the foundational authentication method that enables platform access.

**Why this priority**: Core authentication capability required for all users; enables access to the chat platform; foundational for other features like profile management and chat history.

**Independent Test**: Can be fully tested through signup/login flow; delivers working authentication that blocks unauthorized access and enables authorized access.

**Acceptance Scenarios**:

1. **Given** user is on /signup page, **When** they enter valid email and password with confirmation, **Then** account is created and verification email is sent
2. **Given** user account exists with verified status, **When** they enter correct email/password on /login, **Then** they receive authentication cookie and redirect to /chat
3. **Given** user enters wrong password, **When** they attempt login, **Then** they see error message and remain on login page
4. **Given** user enters unregistered email, **When** they attempt login, **Then** they see "Account not found" error
5. **Given** authentication cookie exists, **When** user navigates to /chat, **Then** they are allowed access without re-authentication
6. **Given** user clicks logout, **When** logout completes, **Then** authentication cookie is cleared and user redirects to landing page

---

### User Story 2 - Email Verification (Priority: P1)

After signup, users must verify their email address using a code sent to their email before they can access the chat platform. This prevents account takeover and ensures valid contact information.

**Why this priority**: Blocks unverified accounts from chatting; protects against fraudulent signups; ensures valid email for password reset and notifications.

**Independent Test**: Can be fully tested by signing up, receiving code, and entering it to verify; delivers protection against unverified accounts accessing the platform.

**Acceptance Scenarios**:

1. **Given** user just signed up with email, **When** email is delivered, **Then** it contains a 6-digit verification code
2. **Given** user is on /verify page with unverified account, **When** they enter correct code, **Then** account is marked verified and they can log in
3. **Given** user enters wrong verification code, **When** code validation runs, **Then** error message displays
4. **Given** verification code has expired (>10 min), **When** user attempts to use it, **Then** system rejects code and offers to resend
5. **Given** user requests code resend, **When** request is processed, **Then** new code is generated and sent via email
6. **Given** user is verified, **When** they attempt to access /verify again, **Then** they are redirected to /chat

---

### User Story 3 - Google OAuth Sign In (Priority: P1)

Users can authenticate using their Google account, which automatically signs them up if first-time, and stores their Google profile picture and name. **CLARIFIED (Q1)**: If user previously signed up with email/password using same email, the systems MERGES both auth methods into one user account.

**Why this priority**: Reduces friction for new users; leverages trusted identity provider; enables social sign-on for faster onboarding.

**Independent Test**: Can be fully tested by clicking "Sign in with Google" button and completing OAuth flow; delivers fully authenticated account with minimal user effort.

**Acceptance Scenarios**:

1. **Given** user is on landing/login page, **When** they click "Sign in with Google", **Then** they are redirected to Google OAuth flow
2. **Given** user completes Google OAuth authorization, **When** flow returns to app, **Then** account is created/found and user receives auth cookie
3. **Given** first-time Google user, **When** they complete OAuth, **Then** account is auto-created with email, name, and profile picture from Google
4. **Given** existing Google user, **When** they sign in with Google again, **Then** they receive authenticated session without creating duplicate account
5. **Given** user has email/password account with email@example.com, **When** they sign in with Google using same email, **Then** both auth methods linked to same user (one account, two login options)
6. **Given** user authenticated via Google, **When** they view profile, **Then** profile picture and name from Google account are displayed
7. **Given** authenticated user, **When** they log out, **Then** Google session is terminated and they must re-authenticate on next visit

---

### User Story 4 - Password Reset (Priority: P2)

Users who forget their password can reset it by receiving a verification code via email, entering that code, and setting a new password.

**Why this priority**: Enables account recovery after forgotten password; reduces support burden; essential for user retention; high value but not critical for initial launch if signup works.

**Independent Test**: Can be fully tested by initiating forgot password, receiving email code, submitting code and new password; delivers ability to regain account access.

**Acceptance Scenarios**:

1. **Given** user is on /login page, **When** they click "Forgot Password", **Then** they navigate to /forgot-password form
2. **Given** user enters email on /forgot-password, **When** they submit, **Then** system sends 6-digit reset code via email
3. **Given** user receives reset code, **When** they navigate to /reset-password and enter code, **Then** system validates code
4. **Given** valid code is entered, **When** user enters new password, **Then** password is updated and user redirected to login
5. **Given** user enters invalid code, **When** they submit, **Then** error message displays and they can request new code
6. **Given** reset code expires (>10 min), **When** user attempts to use it, **Then** code is rejected and resend option shown
7. **Given** user successfully resets password, **When** they log in with new password, **Then** authentication succeeds

---

### User Story 5 - Secure Cookie-Based Authentication (Priority: P2)

All authentication uses HTTP-only cookies with security properties (Secure, SameSite=Lax, HttpOnly) to prevent token theft and XSS attacks. **CLARIFIED (Q2)**: Access token expiry (15 min) is handled via silent auto-refresh using axios interceptor.

**Why this priority**: Foundation for security posture; critical for protecting user accounts; separates authenticated from unauthenticated requests.

**Independent Test**: Can be tested by verifying cookie attributes in browser dev tools and confirming JavaScript cannot access tokens; delivers protection against common attack vectors.

**Acceptance Scenarios**:

1. **Given** user successfully authenticates, **When** authentication response is returned, **Then** access_token and refresh_token cookies are set
2. **Given** authentication cookies are set, **When** browser developer tools inspect them, **Then** HttpOnly, Secure, and SameSite=Lax flags are present
3. **Given** user with valid cookie, **When** they make API request, **Then** cookie is automatically sent with request
4. **Given** user logs out, **When** logout endpoint is called, **Then** cookies are cleared (max-age=0)
5. **Given** user's access token expired (15 min), **When** they make API request, **Then** system auto-refreshes token silently and retries request without user seeing any error
6. **Given** refresh token also expired (7 days), **When** user makes API request, **Then** system redirects to login page
7. **Given** multiple tabs open, **When** user logs out in one tab, **Then** other tabs recognize logout on next action and redirect to login

---

### Edge Cases

- What happens when user attempts signup with already-registered email? (Offer password reset or account recovery flow)
- What happens when verification code is requested multiple times rapidly? (Rate limit to prevent abuse; allow max 3 requests per hour)
- What happens when user changes email address after signup? (Out of scope for Phase 3; plan for future)
- What happens when email delivery fails for verification code? (Display manual resend option; log failed deliveries)
- What happens when user enters partially correct password? (Reject as invalid; don't reveal which part was wrong)
- What happens when Google returns no profile picture? (Display default avatar)
- What happens when user's email provider goes down during signup? (Allow retry; display helpful error)
- **What happens when user submits same verification code from 2 tabs simultaneously? (CLARIFIED Q4)** First tab succeeds and marks code used (is_used=true), second tab receives INVALID_CODE error because code already consumed. This is correct behavior matching real-world OTP handling.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to sign up with unique email and password
- **FR-002**: System MUST hash passwords using bcrypt with minimum salt rounds of 10
- **FR-003**: System MUST send verification codes via email after signup
- **FR-004**: System MUST validate 6-digit verification codes within 10-minute expiration window
- **FR-005**: System MUST allow verified users to log in with email and password
- **FR-006**: System MUST create HTTP-only authentication cookies upon successful login
- **FR-007**: System MUST support Google OAuth 2.0 authentication flow
- **FR-008**: System MUST auto-create accounts for first-time Google OAuth users
- **FR-009**: System MUST store Google profile picture URL when available
- **FR-010**: System MUST provide password reset functionality via email verification code
- **FR-011**: System MUST validate email format before accepting signup
- **FR-012**: System MUST enforce minimum 8-character password requirement
- **FR-013**: System MUST implement rate limiting on login attempts (max 5 per 15 minutes per IP)
- **FR-014**: System MUST implement rate limiting on verification code requests (max 3 per hour per email)
- **FR-015**: System MUST clear all authentication cookies on logout
- **FR-016**: System MUST reject requests from unauthenticated users to protected routes
- **FR-017**: System MUST provide /api/auth/me endpoint returning current authenticated user info
- **FR-018**: System MUST support localized email templates for EN and AR languages
- **FR-019**: System MUST store user language preference (en/ar) in user profile
- **FR-020**: System MUST auto-refresh expired access tokens silently using axios interceptor (15-min expiry) without user interruption
- **FR-021**: System MUST support CSS-driven RTL layout for Arabic forms using `dir="rtl"` attribute and Tailwind CSS flex-direction reversal (no HTML duplication)
- **FR-022**: System MUST merge email/password and Google OAuth auth methods when user signs in with Google using same email as existing email/password account

### Key Entities

- **User**: Represents a registered platform user with email, password hash, profile data, verification status, preferred language, and auth provider
- **VerificationCode**: Temporary code generated for email verification or password reset; includes code, type (verify/reset), expiration, and associated user
- **AuthSession**: Represents authenticated session with user ID, tokens, creation time, and expiration (implicit through cookies)

## Success Criteria

### Measurable Outcomes

- **SC-001**: New users can complete signup and email verification in under 5 minutes without support intervention
- **SC-002**: System handles 1,000 concurrent login requests without failures or >500ms latency
- **SC-003**: Email verification codes arrive within 2 minutes of signup in 99% of cases
- **SC-004**: Password reset successful recovery rate is 95% (users successfully regain account access)
- **SC-005**: Google OAuth completes authentication within 3 seconds of user authorization
- **SC-006**: Zero successful authentication bypass attempts (account takeover via stolen/forged cookies)
- **SC-007**: 100% of authentication cookies include required security attributes (HttpOnly, Secure, SameSite)
- **SC-008**: Unauthenticated users cannot access protected endpoints (/api/auth/\*, /chat, /profile, etc.)
- **SC-009**: Account creation with duplicate email is rejected with clear error message
- **SC-010**: New users complete first login within 2 minutes of account creation

## Assumptions

- Email service provider is available and reliable (SES, SendGrid, or similar with >99% delivery rate)
- Google OAuth credentials are configured and valid in backend environment
- Users have valid email addresses for recovery and verification (invalid emails result in failed verification)
- Frontend runs on HTTPS for secure cookie transmission
- Refresh token lifecycle allows extended sessions (tokens refresh automatically when near expiration)
- CSRF tokens are managed server-side and validated with each state-changing request
- Password reset codes are valid for 10 minutes; verification codes valid for 10 minutes
- Browser supports secure cookie storage and automatic transmission
- Users access platform primarily from web browsers (native app support is future scope)
- Multi-factor authentication is not required for Phase 3 (can be added in future phases)
- Account linking (multiple auth methods per user) is not in Phase 3 scope
