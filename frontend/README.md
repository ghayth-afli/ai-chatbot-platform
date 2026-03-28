# Nexus Chatbot Frontend

React 18 frontend application for Nexus Chatbot with comprehensive authentication UI.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

Modern React 18 frontend for Nexus Chatbot application with focus on:

- Secure user authentication
- Responsive design
- International support (English/Arabic)
- Accessibility (a11y)
- Performance optimization

---

## Technology Stack

**Frontend Framework**:

- React 18.2.0
- React Router DOM 6.21.0
- JSX/ES6+

**Styling**:

- Tailwind CSS 3.4.1
- PostCSS 8.4.32
- Responsive design

**Authentication**:

- @react-oauth/google 0.12.1
- JWT with HTTP-only cookies
- Token refresh mechanism

**Internationalization**:

- i18next 23.7.6
- react-i18next 14.0.0
- English/Arabic support

**HTTP Client**:

- axios 1.6.2

**Testing**:

- Jest 29.7.0
- React Testing Library 14.1.2
- Playwright 1.58.2 (E2E)

**Development**:

- react-scripts 5.0.1
- ESLint configuration
- Prettier formatting

---

## Features

### Authentication Pages

#### 1. Login Page

- Email and password fields
- "Keep me logged in" checkbox
- "Forgot password?" link
- Google Sign-In button
- Input validation
- Error messages
- Loading states

#### 2. Signup Page

- Email field
- Password with strength indicator
- Confirm password field
- Terms & Privacy confirmation
- Google Sign-Up button
- Auto-login after signup
- Error handling

#### 3. Email Verification

- Code input form
- Resend code functionality
- Copy-paste support
- Auto-verification via link
- 24-hour countdown timer
- Error messages

#### 4. Password Reset

- Email lookup form
- Token-based reset form
- New password entry
- Password confirmation
- Success notification

### Security Features

- HTTP-only cookie storage
- CSRF protection
- Input validation
- XSS prevention
- Password strength indicator
- Rate limit feedback
- Secure token refresh
- Auto-logout on token expiry

### Accessibility

- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast support
- Form validation messages
- Error announcements

### Internationalization

- English (default)
- العربية (Arabic)
- RTL support for Arabic
- Language switcher
- Persistent language preference

---

## Setup Instructions

### 1. Prerequisites

- Node.js 16+
- npm 8+ or yarn
- Git

### 2. Clone Repository

```bash
git clone <repository-url>
cd frontend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables)).

### 5. Start Development Server

```bash
npm start
```

Application runs at `http://localhost:3000`

---

## Environment Variables

### Required Variables

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000/api

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# Environment
REACT_APP_ENVIRONMENT=development
```

### Optional Variables

```env
# Sentry Error Tracking (Production)
REACT_APP_SENTRY_DSN=your-sentry-dsn

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_SENTRY=false
```

### .env.example Template

See [frontend/.env.example](./frontend/.env.example) for complete template.

---

## Available Scripts

### Development

```bash
npm start
```

Runs the app in development mode at `http://localhost:3000`

### Build

```bash
npm run build
```

Builds the app for production to the `build/` folder

### Testing

```bash
npm test
```

Runs the test suite in interactive watch mode

### Test Coverage

```bash
npm test -- --coverage
```

Shows test coverage report

### E2E Testing

```bash
npm run test:e2e
```

Runs Playwright E2E tests

```bash
npm run test:e2e:ui
```

Runs tests with UI debugger

```bash
npm run test:e2e:headed
```

Runs tests in headed mode

#### Eject (Not Recommended)

```bash
npm run eject
```

⚠️ **Warning**: This is irreversible. Only use if you need to customize webpack configuration.

---

## Authentication

### Authentication Flows

#### Email/Password Authentication

1. **Signup**

   ```
   User → Signup Form → Backend API
   ↓
   Email Verification
   ↓
   Auto-login → Dashboard
   ```

2. **Login**

   ```
   User → Login Form → Backend API
   ↓
   JWT + Cookies
   ↓
   Dashboard
   ```

3. **Password Reset**
   ```
   User → Password Reset Form → Email Link
   ↓
   New Password Form → Backend API
   ↓
   Login Page
   ```

#### Google OAuth

```
User → Google Button → Google OAuth
↓
Google Callback → Backend API
↓
Create/Merge Account → Dashboard
```

### Using Authentication Context

```javascript
// In components
import { useAuth } from "./hooks/useAuthStatus";

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Token Refresh

- Automatic token refresh every 15 minutes
- Silent refresh using refresh token
- User stays logged in for 7 days
- HTTP-only cookies prevent JavaScript access
- Secure flag enforced in production

### Protected Routes

```javascript
// In router configuration
<Route
  path="/chat"
  element={
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  }
/>
```

---

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── VerifyEmailPage.jsx
│   │   │   ├── PasswordResetPage.jsx
│   │   │   └── AuthGuard.jsx
│   │   └── common/
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       └── Loading.jsx
│   ├── hooks/
│   │   ├── useAuthStatus.js
│   │   ├── useLogin.js
│   │   ├── useSignup.js
│   │   └── useFetch.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── googleOAuthService.js
│   ├── pages/
│   │   ├── ChatPage.jsx
│   │   ├── LandingPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── i18n/
│   │   └── translations.json
│   ├── App.jsx
│   ├── App.test.jsx
│   └── index.jsx
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── security/
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── playwright.config.ts
```

---

## Testing

### Unit Tests

```bash
npm test
```

Run all tests in watch mode

```bash
npm test -- --watchAll=false
```

Run tests once

```bash
npm test -- --coverage
```

Generate coverage report

### E2E Tests

```bash
npm run test:e2e
```

Test scenarios:

- ✅ Signup flow
- ✅ Email verification
- ✅ Login flow
- ✅ Google sign-in
- ✅ Password reset
- ✅ Logout
- ✅ Rate limiting detection
- ✅ Data persistence

### Coverage Targets

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

---

## Styling

### Tailwind CSS

Using Tailwind CSS 3 for styling:

```jsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click Me
</button>
```

### Dark Mode

Dark mode support available via Tailwind:

```jsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

### Responsive Design

Mobile-first responsive approach:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

---

## Internationalization (i18n)

### Switching Languages

```javascript
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select onChange={(e) => i18n.changeLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  );
}
```

### Using Translations

```javascript
import { useTranslation } from "react-i18next";

function LoginForm() {
  const { t } = useTranslation();

  return (
    <form>
      <label>{t("auth.email")}</label>
      <input placeholder={t("auth.email_placeholder")} />
      <button>{t("auth.login")}</button>
    </form>
  );
}
```

### RTL Support

RTL (Right-to-Left) styling for Arabic:

```jsx
<div className={i18n.language === "ar" ? "rtl" : "ltr"}>{/* Content */}</div>
```

---

## Deployment

### Build for Production

```bash
npm run build
```

Creates optimized build in `build/` folder

### Environment Configuration

Update `.env.production` for production:

```env
REACT_APP_API_BASE_URL=https://api.nexus-chat.ai
REACT_APP_GOOGLE_CLIENT_ID=production-client-id
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_SENTRY=true
```

### Deployment Platforms

#### Vercel

```bash
npm install -g vercel
vercel
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

#### Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

#### Static Hosting (AWS S3 + CloudFront)

```bash
npm run build
aws s3 sync build/ s3://your-bucket/
```

---

## Performance Optimization

### Code Splitting

React Router automatically code-splits pages:

```javascript
import { lazy, Suspense } from "react";

const ChatPage = lazy(() => import("./pages/ChatPage"));

// Use in routes
<Suspense fallback={<Loading />}>
  <ChatPage />
</Suspense>;
```

### Image Optimization

Use modern formats and lazy loading:

```jsx
<img
  src="image.jpg"
  alt="Description"
  loading="lazy"
  srcSet="image-small.jpg 480w, image-large.jpg 1024w"
/>
```

### Bundle Analysis

```bash
npm install --save-dev webpack-bundle-analyzer
```

---

## Troubleshooting

### Issue: Module not found error

**Solution**: Install dependencies

```bash
npm install
```

### Issue: Webpack compilation error

**Solution**: Clear cache

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: API connection refused

**Solution**: Verify API URL in .env

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### Issue: Google OAuth not working

**Solution**: Verify Google Client ID

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Issue: Private route not working

**Solution**: Ensure token is in cookies/localStorage

---

## Security Best Practices

- ✅ Use HTTPS in production
- ✅ Never commit `.env` files
- ✅ Validate all user inputs
- ✅ Use Content Security Policy headers
- ✅ Keep dependencies updated
- ✅ Use secure HTTP-only cookies
- ✅ Implement CSRF protection
- ✅ Regular security audits

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)

---

## Contributing

1. Create feature branch: `git checkout -b feature/auth-ui`
2. Make changes
3. Run tests: `npm test`
4. Create pull request

---

## License

Proprietary - All rights reserved

---

## Support

For issues or questions:

- 📧 Email: support@nexus-chat.ai
- 💬 Chat: In-app support available 24/7
- 📖 User Guide: [docs/USER_GUIDE_AUTH.md](./docs/USER_GUIDE_AUTH.md)

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready ✅
