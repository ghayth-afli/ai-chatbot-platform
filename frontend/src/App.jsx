import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { GoogleOAuthProvider } from "./components/GoogleOAuthMock";
import i18n from "./i18n/config";
import { LanguageProvider } from "./hooks/useLanguage";
import { AuthProvider } from "./hooks/useAuth";
import { GOOGLE_CLIENT_ID } from "./config/oauth";

// Pages
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ChatPageWrapper from "./pages/ChatPage/ChatPage";
import HistoryPage from "./pages/HistoryPage/HistoryPage";

// Components
import PrivateRoute from "./components/PrivateRoute";

// Placeholder pages for future implementation
const ProfilePage = () => (
  <div className="p-8 text-center text-paper">
    <h1 className="text-4xl font-bold text-volt mb-4">Profile</h1>
    <p className="text-lg text-gray-400">Profile page under development</p>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <AuthProvider>
            <div className="min-h-screen bg-ink text-paper font-sans">
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Authentication Routes */}
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/auth/signup" element={<SignupPage />} />
                  <Route
                    path="/auth/verify-email"
                    element={<VerifyEmailPage />}
                  />
                  <Route
                    path="/auth/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/auth/reset-password"
                    element={<ResetPasswordPage />}
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/chat"
                    element={
                      <PrivateRoute>
                        <ChatPageWrapper />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/chat/:sessionId"
                    element={
                      <PrivateRoute>
                        <ChatPageWrapper />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <ProfilePage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <PrivateRoute>
                        <HistoryPage />
                      </PrivateRoute>
                    }
                  />

                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </div>
          </AuthProvider>
        </LanguageProvider>
      </I18nextProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
